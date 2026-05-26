from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from .models import Patient
from .serializers import PatientSerializer

from django.db.models import Count
from django.db.models.functions import Trim
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
        referral_id = self.request.data.get('referral_id')

        with transaction.atomic():
            referral = None
            if referral_id:
                from referrals.models import Referral

                referral = Referral.objects.select_for_update().filter(
                    id=referral_id,
                    is_deleted=False,
                ).first()
                if not referral:
                    raise ValidationError({'referral_id': 'Referral not found or already deleted.'})
                if referral.patient_id:
                    raise ValidationError({'referral_id': 'This referral is already linked to a patient record.'})

            patient = serializer.save(created_by=self.request.user)

            if referral:
                referral.patient = patient
                referral.barangay = patient.barangay
                referral.walkin_name = ''
                referral.walkin_age = ''
                referral.walkin_address = ''
                referral.save(update_fields=[
                    'patient', 'barangay', 'walkin_name', 'walkin_age',
                    'walkin_address', 'updated_at',
                ])
                audit_log(
                    self.request,
                    'update',
                    'Referral',
                    f'Linked walk-in referral {referral.referral_code} to patient record: {patient.full_name}',
                    target_id=referral.id,
                )

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
    disease = (request.query_params.get('disease') or '').strip()

    if disease:
        from consultations.models import PatientVisit

        rows = (
            PatientVisit.objects
            .filter(patient__is_deleted=False)
            .annotate(clean_diagnosis=Trim('diagnosis'))
            .filter(clean_diagnosis__iexact=disease)
            .values('patient__barangay')
            .annotate(count=Count('patient_id', distinct=True))
            .order_by('-count', 'patient__barangay')
        )
        data = [
            {'barangay': row['patient__barangay'], 'count': row['count']}
            for row in rows
            if row['patient__barangay']
        ]
        return Response(data)

    data = Patient.objects.filter(is_deleted=False).values('barangay').annotate(count=Count('id')).order_by('-count')
    return Response(list(data))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_diseases_data(request):
    from consultations.models import PatientVisit

    diagnoses = (
        PatientVisit.objects
        .filter(patient__is_deleted=False)
        .annotate(clean_diagnosis=Trim('diagnosis'))
        .exclude(clean_diagnosis='')
        .values_list('clean_diagnosis', flat=True)
    )
    unique_diseases = {}
    for diagnosis in diagnoses:
        normalized = (diagnosis or '').strip()
        if normalized:
            unique_diseases.setdefault(normalized.lower(), normalized)

    return Response(sorted(unique_diseases.values(), key=str.lower))