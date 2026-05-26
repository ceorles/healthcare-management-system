from django.db.models import Q
from django.utils import timezone
from datetime import datetime, time, timedelta, timezone as dt_timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .analytics import build_dashboard_payload
from .audit import audit_log
from .integrity import verify_audit_chain
from .models import HealthAlert, AuditLog, ClinicInfo, CoreValue, ServiceCategory, ClinicSchedule
from .serializers import HealthAlertSerializer, AuditLogSerializer, ClinicInfoSerializer, CoreValueSerializer, ServiceCategorySerializer, ClinicScheduleSerializer


class AnalyticsDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_dashboard_payload())


class HealthAlertViewSet(viewsets.ModelViewSet):
    queryset = HealthAlert.objects.all().order_by('-created_at')
    serializer_class = HealthAlertSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

# ReadOnlyModelViewSet prevents POST, PUT, and DELETE requests for security!
class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    
    def get_permissions(self):
        if self.action == 'track':
            return [IsAuthenticated()]
        return [IsAdminRole()]

    def get_queryset(self):
        qs = AuditLog.objects.select_related('user').all()
        date = (self.request.query_params.get('date') or '').strip()
        tz_offset = self.request.query_params.get('tz_offset')
        action_name = (self.request.query_params.get('action') or '').strip().lower()
        search = (self.request.query_params.get('search') or '').strip()

        if date:
            try:
                selected_date = datetime.strptime(date, '%Y-%m-%d').date()
                if tz_offset not in (None, ''):
                    offset_minutes = int(tz_offset)
                    start = timezone.make_aware(datetime.combine(selected_date, time.min), dt_timezone.utc)
                    end = timezone.make_aware(datetime.combine(selected_date, time.max), dt_timezone.utc)
                    start = start + timedelta(minutes=offset_minutes)
                    end = end + timedelta(minutes=offset_minutes)
                else:
                    current_tz = timezone.get_current_timezone()
                    start = timezone.make_aware(datetime.combine(selected_date, time.min), current_tz)
                    end = timezone.make_aware(datetime.combine(selected_date, time.max), current_tz)
                qs = qs.filter(timestamp__range=(start, end))
            except (ValueError, TypeError):
                qs = qs.none()
        if action_name:
            action_aliases = {
                'edit': 'update',
                'qr scan': 'qr_scan',
                'qr_scan': 'qr_scan',
                'restore': 'restore',
            }
            action_name = action_aliases.get(action_name, action_name)
            qs = qs.filter(action=action_name)
        if search:
            normalized_search = search.lower().replace(' ', '_')
            action_aliases = {
                'edit': 'update',
                'updated': 'update',
                'new': 'create',
                'created': 'create',
                'qr scan': 'qr_scan',
                'qr_scan': 'qr_scan',
                'restore': 'restore',
                'restored': 'restore',
            }
            search_action = action_aliases.get(search.lower())
            search_q = (
                Q(user__username__icontains=search)
                | Q(user__fullname__icontains=search)
                | Q(user__role__icontains=search)
                | Q(action__icontains=search)
                | Q(action__icontains=normalized_search)
                | Q(model_name__icontains=search)
                | Q(object_id__icontains=search)
                | Q(description__icontains=search)
            )
            if search_action:
                search_q |= Q(action=search_action)
            qs = qs.filter(search_q)
        return qs

    @action(detail=False, methods=['post'], url_path='track')
    def track(self, request):
        action_name = request.data.get('action')
        target_type = request.data.get('target_type') or 'System'
        target_id = request.data.get('target_id') or ''
        description = request.data.get('description') or ''
        metadata = request.data.get('metadata') or {}
        if not isinstance(metadata, dict):
            metadata = {}

        if action_name not in {'view', 'create', 'update', 'delete', 'login', 'logout', 'print', 'qr_scan', 'restore', 'export'}:
            return Response({'detail': 'Invalid audit action.'}, status=status.HTTP_400_BAD_REQUEST)

        log = audit_log(
            request,
            action_name,
            target_type,
            description,
            target_id=target_id,
            metadata=metadata,
        )
        return Response(AuditLogSerializer(log).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='verify-integrity')
    def verify_integrity(self, request):
        return Response(verify_audit_chain(), status=status.HTTP_200_OK)

# Landing Page
# CUSTOM PERMISSION: Anyone can GET, but only Admins can POST/PUT/DELETE
class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS: # GET requests are safe
            return True
        # If it's a POST/PUT/DELETE, check if user is logged in AND is an ADMIN
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class ClinicInfoViewSet(viewsets.ModelViewSet):
    queryset = ClinicInfo.objects.all()
    serializer_class = ClinicInfoSerializer
    permission_classes = [IsAdminOrReadOnly]

class CoreValueViewSet(viewsets.ModelViewSet):
    queryset = CoreValue.objects.all()
    serializer_class = CoreValueSerializer
    permission_classes = [IsAdminOrReadOnly]

class ServiceCategoryViewSet(viewsets.ModelViewSet):
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    permission_classes = [IsAdminOrReadOnly]

class ClinicScheduleViewSet(viewsets.ModelViewSet):
    queryset = ClinicSchedule.objects.all()
    serializer_class = ClinicScheduleSerializer
    permission_classes = [IsAdminOrReadOnly]