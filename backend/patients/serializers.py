from rest_framework import serializers
from datetime import date
from .models import Patient

class PatientSerializer(serializers.ModelSerializer):
    # These are read-only properties from your model, great to send to React!
    age = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()
    deleted_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = '__all__' # '__all__' automatically includes all columns!
        read_only_fields = (
            'patient_id', 'created_by', 'created_at', 'updated_at',
            'is_deleted', 'deleted_at', 'deleted_by',
        )

    def get_deleted_by_name(self, obj):
        if not obj.deleted_by:
            return None
        return obj.deleted_by.fullname or obj.deleted_by.username

    def validate_date_of_birth(self, value):
        if value > date.today():
            raise serializers.ValidationError('Date of birth cannot be in the future.')
        return value