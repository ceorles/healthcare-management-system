from rest_framework import serializers
from .models import Referral

class ReferralSerializer(serializers.ModelSerializer):
    # Pulling your awesome @property methods to send to React!
    patient_name_display = serializers.ReadOnlyField(source='patient_full_name')
    calculated_age = serializers.ReadOnlyField(source='patient_age')

    referred_by_name = serializers.CharField(source='referred_by.username', read_only=True)

    class Meta:
        model = Referral
        fields = '__all__'
        read_only_fields = ('referral_code', 'referred_by', 'created_at', 'updated_at')