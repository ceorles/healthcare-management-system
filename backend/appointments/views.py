from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from core.audit import audit_log
from .models import Appointment
from .serializers import AppointmentSerializer


def _parse_date_param(value, label):
    if not value:
        return None
    from django.utils.dateparse import parse_date

    parsed = parse_date(value)
    if not parsed:
        raise ValidationError({label: 'Use YYYY-MM-DD date format.'})
    return parsed


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.select_related('patient', 'doctor').all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        patient_id = self.request.query_params.get('patient')
        date = _parse_date_param(self.request.query_params.get('date'), 'date')
        start_date = _parse_date_param(self.request.query_params.get('start_date'), 'start_date')
        end_date = _parse_date_param(self.request.query_params.get('end_date'), 'end_date')
        doctor_id = self.request.query_params.get('doctor')
        status = self.request.query_params.get('status')
        appointment_type = self.request.query_params.get('appointment_type')
        mine = self.request.query_params.get('mine') in ('1', 'true', 'True')
        follow_up_only = self.request.query_params.get('follow_up_only') in ('1', 'true', 'True')

        if mine:
            qs = qs.filter(doctor=user)
        elif doctor_id:
            qs = qs.filter(doctor_id=doctor_id)

        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        if date:
            qs = qs.filter(appointment_date=date)
        if start_date:
            qs = qs.filter(appointment_date__gte=start_date)
        if end_date:
            qs = qs.filter(appointment_date__lte=end_date)
        if status:
            qs = qs.filter(status=status)
        if appointment_type:
            qs = qs.filter(appointment_type=appointment_type)
        if follow_up_only:
            qs = qs.filter(source_visit__isnull=False).distinct()

        ordering = ('appointment_date', 'appointment_time') if (date or start_date or end_date) else ('-appointment_date', '-appointment_time')
        return qs.order_by(*ordering)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        previous_status = self.get_object().status
        appointment = serializer.save()
        appointment.source_visit.update(follow_up_date=appointment.appointment_date)
        action = 'update'
        if previous_status != appointment.status and appointment.status in ('cancelled', 'no_show'):
            action = 'update'
            status_label = appointment.status_display
            description = f'{status_label} appointment of {appointment.patient.full_name}'
        else:
            description = f'Admin edited appointment of {appointment.patient.full_name}'
        audit_log(
            self.request,
            action,
            'Appointment',
            description,
            target_id=appointment.id,
        )

    def perform_destroy(self, instance):
        patient_name = instance.patient.full_name
        appointment_id = instance.id
        audit_log(
            self.request,
            'delete',
            'Appointment',
            f'Admin deleted appointment of {patient_name}',
            target_id=appointment_id,
        )
        instance.delete()
