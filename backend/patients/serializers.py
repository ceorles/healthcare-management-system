import re
from rest_framework import serializers
from datetime import date
from .models import Patient

PHILHEALTH_PATTERN = re.compile(r'^\d{2}-\d{9}-\d{1}$')
VALID_BLOOD_TYPES = {'N/A', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'}

class PatientSerializer(serializers.ModelSerializer):
    # These are read-only properties from your model, great to send to React!
    age = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()
    deleted_by_name = serializers.SerializerMethodField()
    integrity_status = serializers.SerializerMethodField()
    hash_short = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = '__all__' # '__all__' automatically includes all columns!
        read_only_fields = (
            'patient_id', 'created_by', 'created_at', 'updated_at',
            'is_deleted', 'deleted_at', 'deleted_by', 'record_hash',
        )

    def get_deleted_by_name(self, obj):
        if not obj.deleted_by:
            return None
        return obj.deleted_by.fullname or obj.deleted_by.username

    def get_integrity_status(self, obj):
        return 'Verified' if obj.verify_integrity() else 'Tampered'

    def get_hash_short(self, obj):
        if not obj.record_hash:
            return ''
        return f'{obj.record_hash[:16]}...'

    def validate_date_of_birth(self, value):
        if value > date.today():
            raise serializers.ValidationError('Date of birth cannot be in the future.')
        return value

    def validate_blood_type(self, value):
        normalized = (value or 'N/A').strip().upper()
        if normalized in {'NA', 'NONE', ''}:
            normalized = 'N/A'
        if normalized not in VALID_BLOOD_TYPES:
            raise serializers.ValidationError('Select a valid blood type.')
        return normalized

    def validate_philhealth_number(self, value):
        normalized = (value or '').strip()
        if normalized and not PHILHEALTH_PATTERN.match(normalized):
            raise serializers.ValidationError('PhilHealth Number must follow this format: XX-XXXXXXXXX-X.')
        return normalized