from django.db import migrations, models


def convert_confirmed_to_scheduled(apps, schema_editor):
    Appointment = apps.get_model('appointments', 'Appointment')
    Appointment.objects.filter(status='confirmed').update(status='scheduled')


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(convert_confirmed_to_scheduled, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='appointment',
            name='status',
            field=models.CharField(
                choices=[
                    ('scheduled', 'Scheduled'),
                    ('completed', 'Completed'),
                    ('cancelled', 'Cancelled'),
                    ('no_show', 'No Show'),
                ],
                default='scheduled',
                max_length=20,
            ),
        ),
    ]
