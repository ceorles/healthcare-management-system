from rest_framework import serializers
from .models import VitalSigns, PatientVisit

class VitalSignsSerializer(serializers.ModelSerializer):
    bmi = serializers.ReadOnlyField()
    bp_display = serializers.ReadOnlyField()

    class Meta:
        model = VitalSigns
        fields = '__all__'
        read_only_fields = ('recorded_by', 'recorded_at')

class PatientVisitSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    
    class Meta:
        model = PatientVisit
        fields = '__all__'