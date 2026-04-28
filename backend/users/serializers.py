from rest_framework import serializers
from .models import User

# FOR VIEWING
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['fullname', 'id', 'username', 'email', 'phone_number', 'role', 'barangay', 'is_active', 'date_joined', 'last_login']

# FOR REGISTERING
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['fullname', 'username', 'email', 'phone_number', 'role', 'barangay', 'password', 'confirm_password']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            fullname=validated_data.get('fullname', ''),
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            phone_number=validated_data.get('phone_number', ''),
            role=validated_data.get('role', 'NURSE'),
            barangay=validated_data.get('barangay', '') if validated_data.get('role') == 'NURSE' else '',
            password=validated_data['password'],
        )
        return user