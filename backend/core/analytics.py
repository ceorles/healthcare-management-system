from collections import Counter

from django.db.models import Count
from django.db.models.functions import ExtractMonth
from django.utils import timezone

from consultations.models import PatientVisit
from patients.models import Patient
from referrals.models import Referral
from users.models import User

MONTH_LABELS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

ROLE_LABELS = {
    'ADMIN': 'Admin',
    'DOCTOR': 'Doctor',
    'NURSE': 'Nurse',
    'STAFF': 'Staff',
}


def _monthly_series(queryset, date_field, year):
    rows = (
        queryset.filter(**{f'{date_field}__year': year})
        .annotate(month=ExtractMonth(date_field))
        .values('month')
        .annotate(count=Count('id'))
    )
    month_map = {row['month']: row['count'] for row in rows}
    return [
        {'month': MONTH_LABELS[i], 'count': month_map.get(i + 1, 0)}
        for i in range(12)
    ]


def _normalize_diagnosis(value):
    text = (value or '').strip()
    if not text:
        return None
    return text[:120]


def build_dashboard_payload():
    now = timezone.localtime()
    year = now.year

    total_patients = Patient.objects.filter(is_active=True).count()
    total_staff = User.objects.filter(is_active=True).count()
    total_visits = PatientVisit.objects.count()
    total_referrals = Referral.objects.count()

    patients_by_barangay = list(
        Patient.objects.filter(is_active=True)
        .values('barangay')
        .annotate(count=Count('id'))
        .order_by('-count', 'barangay')[:10]
    )

    referrals_by_barangay = list(
        Referral.objects.values('barangay')
        .annotate(count=Count('id'))
        .order_by('-count', 'barangay')[:10]
    )

    sex_rows = (
        Patient.objects.filter(is_active=True)
        .values('sex')
        .annotate(count=Count('id'))
    )
    patient_sex_distribution = [
        {
            'label': 'Male' if row['sex'] == 'M' else 'Female',
            'count': row['count'],
        }
        for row in sex_rows
        if row['sex'] in ('M', 'F')
    ]

    staff_rows = (
        User.objects.filter(is_active=True)
        .values('role')
        .annotate(count=Count('id'))
    )
    staff_by_role = [
        {
            'label': ROLE_LABELS.get(row['role'], row['role']),
            'count': row['count'],
        }
        for row in staff_rows
    ]

    diagnosis_counter = Counter()
    for diagnosis in PatientVisit.objects.exclude(diagnosis='').values_list('diagnosis', flat=True):
        label = _normalize_diagnosis(diagnosis)
        if label:
            diagnosis_counter[label] += 1

    disease_distribution = [
        {'label': label, 'count': count}
        for label, count in diagnosis_counter.most_common(8)
    ]

    return {
        'report_as_of': now.date().isoformat(),
        'summary': {
            'total_patients': total_patients,
            'total_staff': total_staff,
            'total_visits': total_visits,
            'total_referrals': total_referrals,
        },
        'monthly_visits': _monthly_series(PatientVisit.objects.all(), 'visit_date', year),
        'monthly_referrals': _monthly_series(Referral.objects.all(), 'created_at', year),
        'patients_by_barangay': patients_by_barangay,
        'referrals_by_barangay': referrals_by_barangay,
        'disease_distribution': disease_distribution,
        'patient_sex_distribution': patient_sex_distribution,
        'staff_by_role': staff_by_role,
    }
