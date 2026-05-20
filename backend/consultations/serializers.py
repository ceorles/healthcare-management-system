from rest_framework import serializers
from appointments.models import Appointment
from prescriptions.models import Prescription
from .models import VitalSigns, PatientVisit
from .scds import analyze_clinical_data
from .utils import format_user_display_name


class VitalSignsSerializer(serializers.ModelSerializer):
    bmi = serializers.ReadOnlyField()
    bp_display = serializers.ReadOnlyField()

    class Meta:
        model = VitalSigns
        fields = '__all__'
        read_only_fields = ('recorded_by', 'recorded_at', 'patient')


class PrescriptionReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = [
            'id', 'medication_name', 'dosage', 'frequency',
            'duration', 'instructions', 'created_at',
        ]


class PrescriptionWriteSerializer(serializers.Serializer):
    medication_name = serializers.CharField(max_length=200)
    dosage = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    frequency = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    duration = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    instructions = serializers.CharField(required=False, allow_blank=True, default='')


class FollowUpAppointmentSerializer(serializers.Serializer):
    appointment_date = serializers.DateField()
    appointment_time = serializers.TimeField()
    appointment_type = serializers.ChoiceField(choices=Appointment.TYPE_CHOICES, default='follow_up')
    doctor = serializers.IntegerField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class PatientVisitSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    vitals_detail = VitalSignsSerializer(source='vitals', read_only=True)
    prescriptions = PrescriptionReadSerializer(many=True, read_only=True)
    has_follow_up = serializers.SerializerMethodField()
    follow_up_summary = serializers.SerializerMethodField()

    class Meta:
        model = PatientVisit
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'follow_up_appointment', 'created_by')

    def get_doctor_name(self, obj):
        return format_user_display_name(obj.doctor, with_dr_title=True) or 'Unassigned'

    def get_created_by_name(self, obj):
        return format_user_display_name(obj.created_by, with_dr_title=True) or 'Staff'

    def get_has_follow_up(self, obj):
        return obj.follow_up_appointment_id is not None

    def get_follow_up_summary(self, obj):
        appt = obj.follow_up_appointment
        if not appt:
            return None
        doctor_name = format_user_display_name(appt.doctor, with_dr_title=True) or 'Unassigned'
        return {
            'appointment_date': appt.appointment_date,
            'appointment_time': appt.appointment_time,
            'appointment_type': appt.appointment_type,
            'doctor_name': doctor_name,
            'notes': appt.notes,
        }


class PatientVisitWriteSerializer(serializers.ModelSerializer):
    vitals = serializers.DictField(write_only=True, required=False)
    schedule_follow_up = serializers.BooleanField(write_only=True, required=False, default=False)
    follow_up = FollowUpAppointmentSerializer(write_only=True, required=False)
    scds_output = serializers.JSONField(required=False, allow_null=True)
    prescriptions = PrescriptionWriteSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = PatientVisit
        fields = [
            'patient', 'doctor', 'nurse', 'visit_date', 'chief_complaint', 'symptoms',
            'diagnosis', 'treatment_given', 'notes', 'follow_up_date', 'status',
            'vitals', 'schedule_follow_up', 'follow_up', 'scds_output', 'prescriptions',
        ]

    def create(self, validated_data):
        vitals_data = validated_data.pop('vitals', None)
        schedule_follow_up = validated_data.pop('schedule_follow_up', False)
        follow_up_data = validated_data.pop('follow_up', None)
        prescriptions_data = validated_data.pop('prescriptions', [])
        request = self.context.get('request')

        vitals_instance = None
        if vitals_data:
            allowed_vital_fields = {
                'blood_pressure_systolic', 'blood_pressure_diastolic', 'heart_rate',
                'temperature', 'respiratory_rate', 'oxygen_saturation', 'weight', 'height',
            }
            clean_vitals = {
                k: v for k, v in vitals_data.items()
                if k in allowed_vital_fields and v not in (None, '')
            }
            if clean_vitals:
                vitals_instance = VitalSigns.objects.create(
                    patient=validated_data['patient'],
                    recorded_by=request.user if request else None,
                    **clean_vitals,
                )

        if not validated_data.get('scds_output') and validated_data.get('symptoms'):
            validated_data['scds_output'] = analyze_clinical_data(
                validated_data.get('symptoms', ''),
                vitals_data or {},
            )

        visit = PatientVisit.objects.create(vitals=vitals_instance, **validated_data)

        for rx in prescriptions_data:
            medication = (rx.get('medication_name') or '').strip()
            if not medication:
                continue
            Prescription.objects.create(
                visit=visit,
                prescribed_by=request.user if request else None,
                medication_name=medication,
                dosage=rx.get('dosage', ''),
                frequency=rx.get('frequency', ''),
                duration=rx.get('duration', ''),
                instructions=rx.get('instructions', ''),
            )

        if schedule_follow_up and follow_up_data:
            appointment = Appointment.objects.create(
                patient=visit.patient,
                doctor_id=follow_up_data.get('doctor') or (visit.doctor_id if visit.doctor_id else None),
                appointment_date=follow_up_data['appointment_date'],
                appointment_time=follow_up_data['appointment_time'],
                appointment_type=follow_up_data.get('appointment_type', 'follow_up'),
                notes=follow_up_data.get('notes', ''),
                reason=f'Follow-up from visit on {visit.visit_date.date()}',
                created_by=request.user if request else None,
            )
            visit.follow_up_appointment = appointment
            visit.follow_up_date = follow_up_data['appointment_date']
            visit.save(update_fields=['follow_up_appointment', 'follow_up_date'])

        return visit

    def to_representation(self, instance):
        return PatientVisitSerializer(instance, context=self.context).data


class SCDSAnalyzeSerializer(serializers.Serializer):
    symptoms = serializers.CharField(required=False, allow_blank=True)
    vitals = serializers.DictField(required=False)

    def create(self, validated_data):
        return analyze_clinical_data(
            validated_data.get('symptoms', ''),
            validated_data.get('vitals', {}),
        )

    def to_representation(self, instance):
        return instance
