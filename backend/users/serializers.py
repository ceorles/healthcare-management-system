import re
from django.contrib.auth import password_validation
from rest_framework import serializers
from .models import User

PUBLIC_REGISTER_ROLES = {'NURSE', 'DOCTOR', 'STAFF'}
ADMIN_CREATE_ROLES = {'ADMIN', 'DOCTOR', 'NURSE', 'STAFF'}
BARANGAY_REQUIRED_ROLES = {'NURSE', 'STAFF'}


def resolve_barangay_for_role(role, barangay):
    if role in BARANGAY_REQUIRED_ROLES:
        return (barangay or '').strip()
    return ''


def validate_barangay_for_role(role, barangay):
    if role in BARANGAY_REQUIRED_ROLES and not (barangay or '').strip():
        raise serializers.ValidationError({
            'barangay': 'Barangay is required for Nurse and Staff accounts.',
        })


class UserSerializer(serializers.ModelSerializer):
    verification_status_display = serializers.CharField(
        source='get_verification_status_display',
        read_only=True,
    )

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'fullname', 'username', 'email',
            'phone_number', 'role', 'barangay', 'is_active', 'verification_status',
            'verification_status_display', 'rejection_reason', 'date_joined', 'last_login',
        ]
        read_only_fields = ('verification_status', 'rejection_reason')

    def validate(self, data):
        instance = self.instance
        role = data.get('role', instance.role if instance else None)
        barangay = data.get('barangay', instance.barangay if instance else '')
        validate_barangay_for_role(role, barangay)
        if role not in BARANGAY_REQUIRED_ROLES:
            data['barangay'] = ''
        return data


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'email', 'phone_number']

    def validate_username(self, value):
        if not re.match(r'^\w+$', value):
            raise serializers.ValidationError(
                'Only letters, numbers, and underscores. No spaces.'
            )
        user = self.instance
        if User.objects.filter(username=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError('Email is required.')
        user = self.instance
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('This email is already in use.')
        return value

    def validate(self, data):
        first = data.get('first_name', self.instance.first_name or '')
        last = data.get('last_name', self.instance.last_name or '')
        if not (first.strip() or last.strip()):
            raise serializers.ValidationError({'first_name': 'First or last name is required.'})
        return data

    def update(self, instance, validated_data):
        user = super().update(instance, validated_data)
        first = (user.first_name or '').strip()
        last = (user.last_name or '').strip()
        user.fullname = f'{first} {last}'.strip()
        user.save(update_fields=['fullname'])
        return user

    def to_representation(self, instance):
        return UserSerializer(instance).data


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'New passwords do not match.',
            })
        return data

    def validate_new_password(self, value):
        password_validation.validate_password(value, self.context['request'].user)
        return value


class PublicRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'fullname', 'username', 'email', 'phone_number', 'role',
            'barangay', 'password', 'confirm_password',
        ]

    def validate_role(self, value):
        if value not in PUBLIC_REGISTER_ROLES:
            raise serializers.ValidationError(
                'Admin accounts cannot be created through public registration.'
            )
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        role = data.get('role', 'NURSE')
        validate_barangay_for_role(role, data.get('barangay', ''))
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        role = validated_data.get('role', 'NURSE')
        user = User.objects.create_user(
            fullname=validated_data.get('fullname', ''),
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            phone_number=validated_data.get('phone_number', ''),
            role=role,
            barangay=resolve_barangay_for_role(role, validated_data.get('barangay', '')),
            password=validated_data['password'],
            is_active=False,
            verification_status='PENDING',
        )
        return user


class AdminStaffCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'fullname', 'username', 'email', 'phone_number', 'role',
            'barangay', 'password', 'confirm_password',
        ]

    def validate_role(self, value):
        if value not in ADMIN_CREATE_ROLES:
            raise serializers.ValidationError('Invalid role for staff account creation.')
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        role = data.get('role', 'NURSE')
        validate_barangay_for_role(role, data.get('barangay', ''))
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        role = validated_data.get('role', 'NURSE')
        user = User.objects.create_user(
            fullname=validated_data.get('fullname', ''),
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            phone_number=validated_data.get('phone_number', ''),
            role=role,
            barangay=resolve_barangay_for_role(role, validated_data.get('barangay', '')),
            password=validated_data['password'],
            is_active=True,
            verification_status='VERIFIED',
        )
        return user
