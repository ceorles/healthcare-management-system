from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.audit import audit_log
from .models import VitalSigns, PatientVisit
from .serializers import (
    VitalSignsSerializer,
    PatientVisitSerializer,
    PatientVisitWriteSerializer,
    SCDSAnalyzeSerializer,
)


class VitalSignsViewSet(viewsets.ModelViewSet):
    queryset = VitalSigns.objects.all()
    serializer_class = VitalSignsSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


class PatientVisitViewSet(viewsets.ModelViewSet):
    queryset = PatientVisit.objects.select_related(
        'patient', 'doctor', 'nurse', 'vitals', 'created_by',
        'follow_up_appointment', 'follow_up_appointment__doctor',
    ).prefetch_related('prescriptions').all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return PatientVisitWriteSerializer
        return PatientVisitSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role in ('NURSE', 'STAFF'):
            raise PermissionDenied('Nurse and Staff accounts are not allowed to create patient visits.')

        extra = {'created_by': user}
        if user.role == 'DOCTOR' and not serializer.validated_data.get('doctor'):
            extra['doctor'] = user
        visit = serializer.save(**extra)
        audit_log(
            self.request,
            'create',
            'Visit',
            f'Created visit for patient: {visit.patient.full_name}',
            target_id=visit.id,
        )

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        visit = self.get_object()
        audit_log(
            request,
            'view',
            'Visit',
            f'Viewed visit for patient: {visit.patient.full_name}',
            target_id=visit.id,
        )
        return response

    @action(detail=False, methods=['post'], url_path='analyze-scds')
    def analyze_scds(self, request):
        serializer = SCDSAnalyzeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response(result, status=status.HTTP_200_OK)
