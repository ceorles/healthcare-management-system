from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0003_referral_soft_delete'),
    ]

    operations = [
        migrations.AddField(
            model_name='referral',
            name='referral_date',
            field=models.DateField(default=django.utils.timezone.localdate),
        ),
    ]
