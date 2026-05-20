from django.db import models
from patients.models import Patient
# from users.models import User
from django.conf import settings
from core.constants import BARANGAYS

class Referral(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('accepted', 'Accepted'), ('completed', 'Completed'), ('cancelled', 'Cancelled')]
    referral_code = models.CharField(max_length=20, unique=True, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.SET_NULL, null=True, blank=True, related_name='referrals')
    
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

    def save(self, *args, **kwargs):
        if not self.referral_code:
            import random, string
            code = 'REF-' + ''.join(random.choices(string.digits, k=8))
            self.referral_code = code
        super().save(*args, **kwargs)

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