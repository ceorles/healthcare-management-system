from datetime import datetime, time, timedelta

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
    guardian_name = models.CharField(max_length=200, blank=True)
    guardian_contact_info = models.CharField(max_length=20, blank=True)
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
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deleted_patients',
    )

    def save(self, *args, **kwargs):
        if not self.patient_id:
            year = timezone.now().year
            count = Patient.objects.filter(created_at__year=year).count() + 1
            self.patient_id = f"SHC-{year}-{count:04d}"
        super().save(*args, **kwargs)

    @property
    def age(self):
        born = self.date_of_birth
        now = datetime.now()
        birth_start = datetime.combine(born, time.min)

        if birth_start.date() > now.date():
            return ''

        age_delta = now - birth_start
        if age_delta < timedelta(days=1):
            hours = max(age_delta.seconds // 3600, 1)
            return f'{hours}h'

        days = age_delta.days
        if days < 7:
            return f'{days}d'

        months = (now.year - born.year) * 12 + now.month - born.month
        if now.day < born.day:
            months -= 1

        if months < 1:
            weeks = max(days // 7, 1)
            return f'{weeks}w'

        if months < 12:
            return f'{months}m'

        years = now.year - born.year - ((now.month, now.day) < (born.month, born.day))
        return f'{years}y'

    @property
    def full_name(self):
        return f"{self.last_name}, {self.first_name} {self.middle_name}".strip()

    def __str__(self):
        return f"{self.full_name} ({self.patient_id})"
