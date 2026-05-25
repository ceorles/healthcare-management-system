from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from .models import Patient
from .serializers import PatientSerializer

from django.db.models import Count
from rest_framework.decorators import api_view, permission_classes # action
from rest_framework.response import Response
from core.audit import audit_log

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-created_at')
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated] # Only logged-in users can view/edit

    def get_queryset(self):
        qs = Patient.objects.all().order_by('-created_at')
        if self.action == 'trash':
            return qs.filter(is_deleted=True)
        return qs.filter(is_deleted=False)

    def _require_admin(self):
        if self.request.user.role != 'ADMIN':
            raise PermissionDenied('Only administrators can access deleted records.')

    # Automatically set the "created_by" to the logged-in user
    def perform_create(self, serializer):
        patient = serializer.save(created_by=self.request.user)
        audit_log(
            self.request,
            'create',
            'Patient',
            f'Created patient record: {patient.full_name}',
            target_id=patient.id,
        )

    def perform_update(self, serializer):
        patient = serializer.save()
        audit_log(
            self.request,
            'update',
            'Patient',
            f'Updated patient information: {patient.full_name}',
            target_id=patient.id,
        )

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        patient = self.get_object()
        audit_log(
            request,
            'view',
            'Patient',
            f'Viewed patient record: {patient.full_name}',
            target_id=patient.id,
        )
        return response

    def destroy(self, request, *args, **kwargs):
        if getattr(request.user, 'role', None) in ('NURSE', 'STAFF'):
            return Response(
                {'detail': 'Nurse and Staff accounts are not allowed to delete patient records.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        patient = self.get_object()
        patient.is_deleted = True
        patient.deleted_at = timezone.now()
        patient.deleted_by = request.user
        patient.is_active = False
        patient.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by', 'is_active', 'updated_at'])
        audit_log(
            request,
            'delete',
            'Patient',
            f'Deleted patient record: {patient.full_name}',
            target_id=patient.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='trash')
    def trash(self, request):
        self._require_admin()
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        self._require_admin()
        patient = get_object_or_404(Patient, pk=pk, is_deleted=True)
        patient.is_deleted = False
        patient.deleted_at = None
        patient.deleted_by = None
        patient.is_active = True
        patient.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by', 'is_active', 'updated_at'])
        audit_log(
            request,
            'restore',
            'Patient',
            f'Restored patient record: {patient.full_name}',
            target_id=patient.id,
        )
        return Response(self.get_serializer(patient).data)

    # @action(detail=False, methods=['get'])
    # def map_data(self, request):
    #     data = Patient.objects.values('barangay').annotate(count=Count('id'))
    #     return Response(list(data))

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_map_data(request):
    data = Patient.objects.filter(is_deleted=False).values('barangay').annotate(count=Count('id')).order_by('-count')
    return Response(list(data))