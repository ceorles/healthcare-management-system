from rest_framework import serializers
from .models import Appointment

class AppointmentSerializer(serializers.ModelSerializer):
    # This grabs the patient's name so React can show "Juan Dela Cruz" instead of just "ID: 1"
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.fullname', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('queue_number', 'created_by', 'created_at')