from django.db import models
import hashlib
import json
from core.constants import BARANGAYS
# from users.models import User
from django.conf import settings

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create', 'Create'), ('view', 'View'), ('update', 'Update'),
        ('delete', 'Delete'), ('login', 'Login'), ('logout', 'Logout'),
        ('print', 'Print'), ('export', 'Export'), ('qr_scan', 'QR Scan'), ('restore', 'Restore'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=50)
    object_id = models.CharField(max_length=50, blank=True)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    previous_hash = models.CharField(max_length=64, blank=True, db_index=True)
    record_hash = models.CharField(max_length=64, blank=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def canonical_payload(self):
        return {
            'id': self.pk,
            'user_id': self.user_id,
            'action': self.action,
            'model_name': self.model_name,
            'object_id': self.object_id,
            'description': self.description,
            'ip_address': self.ip_address,
            'timestamp': self.timestamp.isoformat() if self.timestamp else '',
            'previous_hash': self.previous_hash or '',
            'metadata': self.metadata or {},
        }

    def calculate_hash(self):
        payload = json.dumps(self.canonical_payload(), sort_keys=True, separators=(',', ':'), default=str)
        return hashlib.sha256(payload.encode('utf-8')).hexdigest()

    def save(self, *args, **kwargs):
        is_create = self.pk is None
        if self.pk:
            original = type(self).objects.filter(pk=self.pk).only('record_hash', 'previous_hash').first()
            if original and original.record_hash and self.record_hash == original.record_hash:
                super().save(*args, **kwargs)
                return

        if not self.previous_hash:
            previous = type(self).objects.exclude(pk=self.pk).order_by('-id').only('record_hash').first()
            self.previous_hash = previous.record_hash if previous else ''

        super().save(*args, **kwargs)

        expected_hash = self.calculate_hash()
        if self.record_hash != expected_hash:
            type(self).objects.filter(pk=self.pk).update(record_hash=expected_hash)
            self.record_hash = expected_hash

        if is_create:
            AuditChainState.objects.update_or_create(
                pk=1,
                defaults={
                    'latest_log_id': self.pk,
                    'latest_hash': self.record_hash,
                    'total_logs': type(self).objects.count(),
                },
            )

    @classmethod
    def log(cls, user, action, model_name, object_id='', description='', request=None, metadata=None):
        ip = None
        if request:
            forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = forwarded.split(',')[0].strip() if forwarded else request.META.get('REMOTE_ADDR')
        cls.objects.create(
            user=user, action=action, model_name=model_name,
            object_id=str(object_id), description=description, ip_address=ip,
            metadata=metadata or {},
        )


class AuditChainState(models.Model):
    latest_log_id = models.PositiveIntegerField(null=True, blank=True)
    latest_hash = models.CharField(max_length=64, blank=True)
    total_logs = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Audit Chain State'
        verbose_name_plural = 'Audit Chain State'


class HealthAlert(models.Model):
    SEVERITY_CHOICES = [('info', 'Info'), ('warning', 'Warning'), ('critical', 'Critical')]
    title = models.CharField(max_length=200)
    message = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='info')
    barangay = models.CharField(max_length=100, blank=True, choices=BARANGAYS)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

# --- LANDING PAGE DYNAMIC CONTENT MODELS ---

class ClinicInfo(models.Model):
    # Contact Info
    address = models.TextField(default="Municipal Health Center, Poblacion, Sariaya, Quezon 4322")
    office_phone = models.CharField(max_length=50, default="(042) 137-5XXX")
    emergency_hotline = models.CharField(max_length=50, default="(+63) 912-345-6789")
    email = models.EmailField(default="mhcsariaya@quezon.gov.ph")
    facebook_link = models.URLField(blank=True, null=True, default="https://facebook.com/MHC")
    
    # Before Your Visit Checklist
    before_visit = models.TextField(default="Bring a valid government-issued ID\nBring your PhilHealth card if applicable\nBring previous medical records if available\nArrive early to your appointment schedule\nWear a face mask and observe health protocols")
    
    # About Info
    vision = models.TextField(default="A united, peaceful and progressive municipality...")
    mission = models.TextField(default="Inspired by and committed to delivering high quality...")
    
    def __str__(self):
        return "Clinic Main Information"

class CoreValue(models.Model):
    """Dynamic Core Values for the About Page"""
    title = models.CharField(max_length=50)
    description = models.TextField()
    icon_name = models.CharField(max_length=50, help_text="Lucide icon name (e.g., Heart, Scale)")

    def __str__(self):
        return self.title

class ServiceCategory(models.Model):
    """Dynamic Services (Medical, Dental, Lab)"""
    title = models.CharField(max_length=100)
    subtitle = models.CharField(max_length=200)
    description = models.TextField()
    icon_name = models.CharField(max_length=50, help_text="Lucide icon name (e.g., Stethoscope)")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

class ClinicSchedule(models.Model):
    """Dynamic Operating Hours"""
    day = models.CharField(max_length=20) # e.g., "Monday"
    hours = models.CharField(max_length=50, default="8:00 AM – 5:00 PM")
    is_open = models.BooleanField(default=True)
    order = models.IntegerField(default=0) # To sort Mon-Sun correctly

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.day}: {'Open' if self.is_open else 'Closed'}"