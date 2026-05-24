from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .analytics import build_dashboard_payload
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
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet): 
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

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