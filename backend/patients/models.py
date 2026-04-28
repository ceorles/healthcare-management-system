from django.db import models
from django.utils import timezone
from core.constants import BARANGAYS
# from users.models import User
from django.conf import settings

class Patient(models.Model):
    SEX_CHOICES = [('M', 'Male'), ('F', 'Female')]
    CIVIL_CHOICES = [('single', 'Single'), ('married', 'Married'), ('widowed', 'Widowed'), ('separated', 'Separated')]

    patient_id = models.CharField(max_length=20, unique=True, editable=False)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    sex = models.CharField(max_length=1, choices=SEX_CHOICES)
    civil_status = models.CharField(max_length=20, choices=CIVIL_CHOICES, default='single')
    contact_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    barangay = models.CharField(max_length=100, choices=BARANGAYS)
    emergency_contact_name = models.CharField(max_length=200, blank=True)
    emergency_contact_number = models.CharField(max_length=20, blank=True)
    philhealth_number = models.CharField(max_length=50, blank=True)
    blood_type = models.CharField(max_length=5, blank=True)
    allergies = models.TextField(blank=True)
    
    # Users linked
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_patients')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.patient_id:
            year = timezone.now().year
            count = Patient.objects.filter(created_at__year=year).count() + 1
            self.patient_id = f"SHC-{year}-{count:04d}"
        super().save(*args, **kwargs)

    @property
    def age(self):
        today = timezone.now().date()
        born = self.date_of_birth
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))

    @property
    def full_name(self):
        return f"{self.last_name}, {self.first_name} {self.middle_name}".strip()

    def __str__(self):
        return f"{self.full_name} ({self.patient_id})"
