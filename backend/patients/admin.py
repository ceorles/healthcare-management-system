from django.contrib import admin
from .models import Patient

class PatientAdmin(admin.ModelAdmin):
    list_display = ('patient_id', 'full_name', 'age', 'sex', 'barangay', 'guardian_name', 'created_by')
    search_fields = ('patient_id', 'first_name', 'last_name', 'barangay')
    list_filter = ('barangay', 'sex', 'is_active')
    readonly_fields = ('patient_id', 'created_at', 'updated_at')

admin.site.register(Patient, PatientAdmin)