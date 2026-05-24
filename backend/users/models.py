from django.contrib.auth.models import AbstractUser
from django.db import models
from core.constants import BARANGAYS

class User(AbstractUser):
    # Custom User
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('DOCTOR', 'Doctor'),
        ('NURSE', 'Nurse'),
        ('STAFF', 'Staff'),
    )

    VERIFICATION_CHOICES = (
        ('PENDING', 'Pending'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
    )

    fullname = models.CharField(max_length=100, blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='NURSE')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    barangay = models.CharField(max_length=50, choices=BARANGAYS, blank=True, null=True)
    verification_status = models.CharField(
        max_length=10,
        choices=VERIFICATION_CHOICES,
        default='PENDING',
    )
    rejection_reason = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.fullname or self.username} - {self.role}"