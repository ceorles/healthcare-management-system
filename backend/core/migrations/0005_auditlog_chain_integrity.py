import hashlib
import json

from django.db import migrations, models


def _calculate_hash(log, previous_hash):
    payload = {
        'id': log.id,
        'user_id': log.user_id,
        'action': log.action,
        'model_name': log.model_name,
        'object_id': log.object_id,
        'description': log.description,
        'ip_address': log.ip_address,
        'timestamp': log.timestamp.isoformat() if log.timestamp else '',
        'previous_hash': previous_hash or '',
        'metadata': log.metadata or {},
    }
    serialized = json.dumps(payload, sort_keys=True, separators=(',', ':'), default=str)
    return hashlib.sha256(serialized.encode('utf-8')).hexdigest()


def backfill_audit_chain(apps, schema_editor):
    AuditLog = apps.get_model('core', 'AuditLog')
    AuditChainState = apps.get_model('core', 'AuditChainState')

    previous_hash = ''
    latest_log_id = None
    latest_hash = ''
    total_logs = 0

    for log in AuditLog.objects.order_by('id'):
        current_hash = _calculate_hash(log, previous_hash)
        AuditLog.objects.filter(pk=log.pk).update(
            previous_hash=previous_hash,
            record_hash=current_hash,
            metadata=log.metadata or {},
        )
        previous_hash = current_hash
        latest_log_id = log.id
        latest_hash = current_hash
        total_logs += 1

    AuditChainState.objects.update_or_create(
        pk=1,
        defaults={
            'latest_log_id': latest_log_id,
            'latest_hash': latest_hash,
            'total_logs': total_logs,
        },
    )


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_alter_auditlog_action'),
    ]

    operations = [
        migrations.AddField(
            model_name='auditlog',
            name='metadata',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='auditlog',
            name='previous_hash',
            field=models.CharField(blank=True, db_index=True, max_length=64),
        ),
        migrations.AlterField(
            model_name='auditlog',
            name='record_hash',
            field=models.CharField(blank=True, db_index=True, max_length=64),
        ),
        migrations.CreateModel(
            name='AuditChainState',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('latest_log_id', models.PositiveIntegerField(blank=True, null=True)),
                ('latest_hash', models.CharField(blank=True, max_length=64)),
                ('total_logs', models.PositiveIntegerField(default=0)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Audit Chain State',
                'verbose_name_plural': 'Audit Chain State',
            },
        ),
        migrations.RunPython(backfill_audit_chain, migrations.RunPython.noop),
    ]
