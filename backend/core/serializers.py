from rest_framework import serializers
from .models import HealthAlert, AuditLog, ClinicInfo, CoreValue, ServiceCategory, ClinicSchedule

class HealthAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthAlert
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at')

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_name = serializers.SerializerMethodField()
    role = serializers.CharField(source='user.role', read_only=True)
    action_type = serializers.SerializerMethodField()
    target_type = serializers.CharField(source='model_name', read_only=True)
    target_id = serializers.CharField(source='object_id', read_only=True)
    hash_short = serializers.SerializerMethodField()
    previous_hash_short = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = (
            'id', 'user', 'username', 'user_name', 'role',
            'action', 'action_type', 'model_name', 'target_type',
            'object_id', 'target_id', 'description', 'ip_address',
            'timestamp', 'record_hash', 'hash_short', 'previous_hash_short',
        )
        read_only_fields = (
            'id', 'user', 'action', 'model_name', 'object_id',
            'description', 'ip_address', 'timestamp', 'record_hash',
        )

    def get_user_name(self, obj):
        if not obj.user:
            return 'System'
        return obj.user.fullname or obj.user.username

    def get_action_type(self, obj):
        labels = {
            'create': 'CREATE',
            'update': 'EDIT',
            'delete': 'DELETE',
            'view': 'VIEW',
            'login': 'LOGIN',
            'logout': 'LOGOUT',
            'print': 'PRINT',
            'qr_scan': 'QR SCAN',
            'restore': 'RESTORE',
            'export': 'EXPORT',
        }
        return labels.get(obj.action, obj.action.upper())

    def get_hash_short(self, obj):
        if not obj.record_hash:
            return ''
        return f'{obj.record_hash[:16]}...'

    def get_previous_hash_short(self, obj):
        if not obj.previous_hash:
            return 'Genesis'
        return f'{obj.previous_hash[:16]}...'

# LANDING PAGE
class ClinicInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicInfo
        fields = '__all__'

class CoreValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoreValue
        fields = '__all__'

class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = '__all__'

class ClinicScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicSchedule
        fields = '__all__'