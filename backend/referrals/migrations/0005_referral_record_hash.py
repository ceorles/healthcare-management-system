import hashlib
import json

from django.db import migrations, models


def calculate_referral_hash(referral):
    payload = {
        'referral_code': referral.referral_code or '',
        'patient_name': referral.walkin_name or '',
        'patient_id': referral.patient_id or '',
        'walkin_name': referral.walkin_name or '',
        'barangay': referral.barangay or '',
        'referred_to': referral.referred_to or '',
        'referred_by': referral.referred_by_id,
        'diagnosis': referral.impression or '',
        'chief_complaint': referral.chief_complaint or '',
        'reason': referral.reason or '',
        'status': referral.status or '',
        'created_at': referral.created_at.isoformat() if referral.created_at else '',
        'updated_at': referral.updated_at.isoformat() if referral.updated_at else '',
        'is_deleted': referral.is_deleted,
    }
    serialized = json.dumps(payload, sort_keys=True, separators=(',', ':'), default=str)
    return hashlib.sha256(serialized.encode('utf-8')).hexdigest()


def backfill_referral_hashes(apps, schema_editor):
    Referral = apps.get_model('referrals', 'Referral')
    for referral in Referral.objects.all().iterator():
        Referral.objects.filter(pk=referral.pk).update(record_hash=calculate_referral_hash(referral))


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0004_referral_referral_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='referral',
            name='record_hash',
            field=models.CharField(blank=True, db_index=True, max_length=64),
        ),
        migrations.RunPython(backfill_referral_hashes, migrations.RunPython.noop),
    ]
