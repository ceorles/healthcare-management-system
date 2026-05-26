import hashlib
import json

from django.db import models
from patients.models import Patient
# from users.models import User
from django.conf import settings
from core.constants import BARANGAYS
from django.utils import timezone

class Referral(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('accepted', 'Accepted'), ('completed', 'Completed'), ('cancelled', 'Cancelled')]
    referral_code = models.CharField(max_length=20, unique=True, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.SET_NULL, null=True, blank=True, related_name='referrals')
    referral_date = models.DateField(default=timezone.localdate)
    
    # Walk-in Fields
    walkin_name = models.CharField(max_length=150, blank=True)
    walkin_age = models.CharField(max_length=10, blank=True)
    walkin_address = models.TextField(blank=True)
    hospital_file_no = models.CharField(max_length=50, blank=True)

    # Referral Details
    barangay = models.CharField(max_length=100, choices=BARANGAYS)
    referred_to = models.CharField(max_length=200, default='Sariaya Municipal Health Center')
    referred_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='made_referrals')
    designation = models.CharField(max_length=100, default='Sariaya Municipal Health Center')

    # Medical Info (From Figma)
    chief_complaint = models.TextField(blank=True)
    brief_history = models.TextField(blank=True)
    bp = models.CharField(max_length=20, blank=True)
    pr = models.CharField(max_length=20, blank=True)
    rr = models.CharField(max_length=20, blank=True)
    temp = models.CharField(max_length=20, blank=True)
    weight = models.CharField(max_length=20, blank=True)
    impression = models.TextField(blank=True)
    reason = models.TextField(blank=True) # Reason for referral
    services_needed = models.TextField(blank=True)
    remarks = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='deleted_referrals')
    record_hash = models.CharField(max_length=64, blank=True, db_index=True)

    def save(self, *args, **kwargs):
        if not self.referral_code:
            import random, string
            code = 'REF-' + ''.join(random.choices(string.digits, k=8))
            self.referral_code = code
        super().save(*args, **kwargs)
        expected_hash = self.calculate_record_hash()
        if self.record_hash != expected_hash:
            type(self).objects.filter(pk=self.pk).update(record_hash=expected_hash)
            self.record_hash = expected_hash

    def calculate_record_hash(self):
        payload = {
            'referral_code': self.referral_code or '',
            'patient_name': self.walkin_name or '',
            'patient_id': self.patient_id or '',
            'walkin_name': self.walkin_name or '',
            'barangay': self.barangay or '',
            'referred_to': self.referred_to or '',
            'referred_by': self.referred_by_id,
            'diagnosis': self.impression or '',
            'chief_complaint': self.chief_complaint or '',
            'reason': self.reason or '',
            'status': self.status or '',
            'created_at': self.created_at.isoformat() if self.created_at else '',
            'updated_at': self.updated_at.isoformat() if self.updated_at else '',
            'is_deleted': self.is_deleted,
        }
        serialized = json.dumps(payload, sort_keys=True, separators=(',', ':'), default=str)
        return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

    def verify_integrity(self):
        if not self.record_hash:
            return False
        return self.record_hash == self.calculate_record_hash()

    @property
    def patient_name_display(self):
        return self.patient.full_name if self.patient else self.walkin_name
    
    @property
    def patient_age_display(self):
        return str(self.patient.age) if self.patient else self.walkin_age
        
    @property
    def patient_address_display(self):
        return self.patient.address if self.patient else self.walkin_address

    @property
    def patient_barangay_display(self):
        return self.patient.barangay if self.patient else self.barangay

    @property
    def patient_contact_display(self):
        return self.patient.contact_number if self.patient else ''