from django.db import migrations, models


def verify_existing_users(apps, schema_editor):
    User = apps.get_model('users', 'User')
    User.objects.all().update(verification_status='VERIFIED', is_active=True)


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_alter_user_is_active'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='rejection_reason',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='user',
            name='verification_status',
            field=models.CharField(
                choices=[('PENDING', 'Pending'), ('VERIFIED', 'Verified'), ('REJECTED', 'Rejected')],
                default='PENDING',
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('ADMIN', 'Admin'),
                    ('DOCTOR', 'Doctor'),
                    ('NURSE', 'Nurse'),
                    ('STAFF', 'Staff'),
                ],
                default='NURSE',
                max_length=10,
            ),
        ),
        migrations.RunPython(verify_existing_users, migrations.RunPython.noop),
    ]
