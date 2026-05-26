from django.db import models
from patients.models import Patient
# from users.models import User
from django.conf import settings # for USERS

class Appointment(models.Model):
    ACTIVE_STATUSES = ('scheduled',)
    STATUS_CHOICES = [('scheduled', 'Scheduled'), ('completed', 'Completed'), ('cancelled', 'Cancelled'), ('no_show', 'No Show')]
    TYPE_CHOICES = [('consultation', 'Consultation'), ('follow_up', 'Follow-up'), ('check_up', 'Check-up'), ('vaccination', 'Vaccination'), ('prenatal', 'Prenatal'), ('other', 'Other')]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='doctor_appointments')
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    appointment_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='consultation')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    queue_number = models.IntegerField(null=True, blank=True)
    sms_sent = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_appointments')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['appointment_date', 'appointment_time']

    def save(self, *args, **kwargs):
        if not self.queue_number:
            count = Appointment.objects.filter(
                appointment_date=self.appointment_date,
                status__in=self.ACTIVE_STATUSES
            ).count()
            self.queue_number = count + 1
        super().save(*args, **kwargs)

    @property
    def status_display(self):
        return self.get_status_display()

    def __str__(self):
        return f"{self.patient} - {self.appointment_date} {self.appointment_time}"