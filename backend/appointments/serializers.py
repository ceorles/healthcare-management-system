from rest_framework import serializers
from datetime import datetime, timedelta
from .models import Appointment
from consultations.utils import format_user_display_name


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.SerializerMethodField()
    appointment_type_display = serializers.CharField(source='get_appointment_type_display', read_only=True)
    status_display = serializers.CharField(read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('queue_number', 'created_by', 'created_at')

    def get_doctor_name(self, obj):
        return format_user_display_name(obj.doctor, with_dr_title=True) or 'Unassigned'

    def validate(self, attrs):
        appointment = self.instance
        patient = attrs.get('patient') or getattr(appointment, 'patient', None)
        doctor = attrs.get('doctor') or getattr(appointment, 'doctor', None)
        appointment_date = attrs.get('appointment_date') or getattr(appointment, 'appointment_date', None)
        appointment_time = attrs.get('appointment_time') or getattr(appointment, 'appointment_time', None)
        status = attrs.get('status') or getattr(appointment, 'status', None)
        previous_status = getattr(appointment, 'status', None)

        if (
            appointment
            and 'status' in attrs
            and previous_status in ('completed', 'cancelled', 'no_show')
            and attrs.get('status') != previous_status
        ):
            raise serializers.ValidationError('Completed, cancelled, and no-show appointments cannot be returned to the active queue.')

        if appointment and 'status' in attrs and attrs.get('status') == 'completed' and previous_status != 'completed':
            raise serializers.ValidationError('Appointments are completed automatically after a visit is created.')

        if status not in Appointment.ACTIVE_STATUSES:
            return attrs

        if not doctor:
            raise serializers.ValidationError('Assigned doctor is required for active appointments.')

        active_appointments = Appointment.objects.filter(status__in=Appointment.ACTIVE_STATUSES)
        if appointment:
            active_appointments = active_appointments.exclude(pk=appointment.pk)

        if patient and active_appointments.filter(patient=patient).exists():
            raise serializers.ValidationError('This patient already has an active follow-up appointment.')

        if doctor and appointment_date and appointment_time:
            selected_start = datetime.combine(appointment_date, appointment_time)
            conflict_window_start = selected_start - timedelta(minutes=30)
            conflict_window_end = selected_start + timedelta(minutes=30)

            for existing in active_appointments.filter(doctor=doctor, appointment_date=appointment_date):
                existing_start = datetime.combine(existing.appointment_date, existing.appointment_time)
                if conflict_window_start < existing_start < conflict_window_end:
                    raise serializers.ValidationError(
                        'This doctor already has an appointment scheduled within 30 minutes of the selected time.'
                    )

        return attrs