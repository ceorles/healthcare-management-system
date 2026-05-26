import hashlib
import json

from django.db import migrations, models


def calculate_patient_hash(patient):
    full_name = f"{patient.last_name}, {patient.first_name} {patient.middle_name}".strip()
    payload = {
        'patient_id': patient.patient_id or '',
        'full_name': full_name,
        'date_of_birth': patient.date_of_birth.isoformat() if patient.date_of_birth else '',
        'sex': patient.sex or '',
        'barangay': patient.barangay or '',
        'contact_number': patient.contact_number or '',
        'address': patient.address or '',
        'philhealth_number': patient.philhealth_number or '',
        'blood_type': patient.blood_type or '',
        'allergies': patient.allergies or '',
        'is_active': patient.is_active,
        'is_deleted': patient.is_deleted,
        'updated_at': patient.updated_at.isoformat() if patient.updated_at else '',
    }
    serialized = json.dumps(payload, sort_keys=True, separators=(',', ':'), default=str)
    return hashlib.sha256(serialized.encode('utf-8')).hexdigest()


def backfill_patient_hashes(apps, schema_editor):
    Patient = apps.get_model('patients', 'Patient')
    for patient in Patient.objects.all().iterator():
        Patient.objects.filter(pk=patient.pk).update(record_hash=calculate_patient_hash(patient))


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0005_patient_blood_type_choices'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='record_hash',
            field=models.CharField(blank=True, db_index=True, max_length=64),
        ),
        migrations.RunPython(backfill_patient_hashes, migrations.RunPython.noop),
    ]
