from rest_framework import serializers
from .models import Referral

class ReferralSerializer(serializers.ModelSerializer):
    # patient_name_display = serializers.ReadOnlyField(source='patient_full_name')
    # patient_name_display = serializers.ReadOnlyField(source='patient_name_display')
    patient_name_display = serializers.ReadOnlyField()
    # calculated_age = serializers.ReadOnlyField(source='patient_age_display')
    patient_age_display = serializers.ReadOnlyField()
    patient_address_display = serializers.ReadOnlyField()
    patient_barangay_display = serializers.ReadOnlyField()
    patient_contact_display = serializers.ReadOnlyField()

    referred_by_name = serializers.SerializerMethodField()

    def get_referred_by_name(self, obj):
        if not obj.referred_by:
            return None
        return obj.referred_by.fullname or obj.referred_by.username

    class Meta:
        model = Referral
        fields = '__all__'
        # read_only_fields = ('referral_code', 'referred_by', 'created_at', 'updated_at')