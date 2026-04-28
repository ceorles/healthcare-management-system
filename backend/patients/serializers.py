from rest_framework import serializers
from .models import Patient

class PatientSerializer(serializers.ModelSerializer):
    # These are read-only properties from your model, great to send to React!
    age = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Patient
        fields = '__all__' # '__all__' automatically includes all columns!
        read_only_fields = ('patient_id', 'created_by', 'created_at', 'updated_at')