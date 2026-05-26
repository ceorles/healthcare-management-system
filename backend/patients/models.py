from datetime import datetime, time, timedelta
import hashlib
import json
import re

from django.db import IntegrityError, models, transaction
from django.utils import timezone
from core.constants import BARANGAYS
# from users.models import User
from django.conf import settings

class PatientIdSequence(models.Model):
    year = models.PositiveIntegerField(unique=True)
    last_number = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-year']

    def __str__(self):
        return f'SHC-{self.year}-{self.last_number:04d}'


class Patient(models.Model):
    SEX_CHOICES = [('M', 'Male'), ('F', 'Female')]
    CIVIL_CHOICES = [('single', 'Single'), ('married', 'Married'), ('widowed', 'Widowed'), ('separated', 'Separated')]
    BLOOD_TYPE_CHOICES = [
        ('N/A', 'N/A'),
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    ]

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
    blood_type = models.CharField(max_length=5, choices=BLOOD_TYPE_CHOICES, default='N/A', blank=True)
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
    record_hash = models.CharField(max_length=64, blank=True, db_index=True)

    @classmethod
    def _last_existing_sequence_for_year(cls, year):
        prefix = f'SHC-{year}-'
        pattern = re.compile(rf'^{re.escape(prefix)}(\d+)$')
        patient_ids = (
            cls.objects
            .filter(patient_id__startswith=prefix)
            .order_by('-patient_id')
            .values_list('patient_id', flat=True)
        )

        for patient_id in patient_ids:
            match = pattern.match(patient_id)
            if match:
                return int(match.group(1))
        return 0

    @classmethod
    def _get_or_create_locked_sequence(cls, year):
        initial_number = cls._last_existing_sequence_for_year(year)
        try:
            with transaction.atomic():
                sequence, _ = PatientIdSequence.objects.select_for_update().get_or_create(
                    year=year,
                    defaults={'last_number': initial_number},
                )
                return sequence
        except IntegrityError:
            return PatientIdSequence.objects.select_for_update().get(year=year)

    @classmethod
    def _generate_patient_id(cls):
        with transaction.atomic():
            year = timezone.now().year
            sequence = cls._get_or_create_locked_sequence(year)
            last_existing_number = cls._last_existing_sequence_for_year(year)
            sequence.last_number = max(sequence.last_number, last_existing_number) + 1
            sequence.save(update_fields=['last_number', 'updated_at'])
            return f'SHC-{year}-{sequence.last_number:04d}'

    def save(self, *args, **kwargs):
        if not self.patient_id:
            with transaction.atomic():
                self.patient_id = self._generate_patient_id()
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)

        expected_hash = self.calculate_record_hash()
        if self.record_hash != expected_hash:
            type(self).objects.filter(pk=self.pk).update(record_hash=expected_hash)
            self.record_hash = expected_hash

    def calculate_record_hash(self):
        payload = {
            'patient_id': self.patient_id or '',
            'full_name': self.full_name or '',
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else '',
            'sex': self.sex or '',
            'barangay': self.barangay or '',
            'contact_number': self.contact_number or '',
            'address': self.address or '',
            'philhealth_number': self.philhealth_number or '',
            'blood_type': self.blood_type or '',
            'allergies': self.allergies or '',
            'is_active': self.is_active,
            'is_deleted': self.is_deleted,
            'updated_at': self.updated_at.isoformat() if self.updated_at else '',
        }
        serialized = json.dumps(payload, sort_keys=True, separators=(',', ':'), default=str)
        return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

    def verify_integrity(self):
        if not self.record_hash:
            return False
        return self.record_hash == self.calculate_record_hash()

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
