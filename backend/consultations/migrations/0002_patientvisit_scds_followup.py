# Generated manually for visit SCDS + follow-up appointment linkage

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0001_initial'),
        ('consultations', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='patientvisit',
            name='scds_output',
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='patientvisit',
            name='follow_up_appointment',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='source_visit',
                to='appointments.appointment',
            ),
        ),
    ]
