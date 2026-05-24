from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        if user.verification_status == 'PENDING':
            raise serializers.ValidationError({
                'detail': 'Your account is pending admin verification. Please wait for approval.',
            })
        if user.verification_status == 'REJECTED':
            reason = user.rejection_reason or 'Contact the health center administrator.'
            raise serializers.ValidationError({
                'detail': f'Your registration was rejected. {reason}',
            })
        if user.verification_status != 'VERIFIED':
            raise serializers.ValidationError({
                'detail': 'Your account is not verified yet.',
            })
        if not user.is_active:
            raise serializers.ValidationError({
                'detail': 'Your account is inactive. Contact the administrator.',
            })
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
