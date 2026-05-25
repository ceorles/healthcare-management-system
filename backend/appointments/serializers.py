from rest_framework import serializers
from .models import Appointment
from consultations.utils import format_user_display_name


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('queue_number', 'created_by', 'created_at')

    def get_doctor_name(self, obj):
        return format_user_display_name(obj.doctor, with_dr_title=True) or 'Unassigned'