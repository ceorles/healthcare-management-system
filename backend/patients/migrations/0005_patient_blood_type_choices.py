from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0004_patientidsequence'),
    ]

    operations = [
        migrations.AlterField(
            model_name='patient',
            name='blood_type',
            field=models.CharField(
                blank=True,
                choices=[
                    ('N/A', 'N/A'),
                    ('A+', 'A+'),
                    ('A-', 'A-'),
                    ('B+', 'B+'),
                    ('B-', 'B-'),
                    ('AB+', 'AB+'),
                    ('AB-', 'AB-'),
                    ('O+', 'O+'),
                    ('O-', 'O-'),
                ],
                default='N/A',
                max_length=5,
            ),
        ),
    ]
