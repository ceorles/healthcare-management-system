from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Referral
from .serializers import ReferralSerializer
from patients.serializers import PatientSerializer
from core.audit import audit_log

class ReferralViewSet(viewsets.ModelViewSet):
    queryset = Referral.objects.select_related('patient', 'referred_by').order_by('-created_at')
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == 'trash':
            return qs.filter(is_deleted=True)
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs.filter(is_deleted=False)

    def _require_admin(self):
        if self.request.user.role != 'ADMIN':
            raise PermissionDenied('Only administrators can access deleted records.')

    def perform_create(self, serializer):
        referral = self._save_with_patient_sync(serializer, referred_by=self.request.user)
        audit_log(
            self.request,
            'create',
            'Referral',
            f'Created referral: {referral.referral_code}',
            target_id=referral.id,
        )

    def perform_update(self, serializer):
        referral = self._save_with_patient_sync(serializer)
        audit_log(
            self.request,
            'update',
            'Referral',
            f'Updated referral: {referral.referral_code}',
            target_id=referral.id,
        )

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        referral = self.get_object()
        audit_log(
            request,
            'view',
            'Referral',
            f'Viewed referral: {referral.referral_code}',
            target_id=referral.id,
        )
        return response

    def destroy(self, request, *args, **kwargs):
        if getattr(request.user, 'role', None) in ('NURSE', 'STAFF'):
            return Response(
                {'detail': 'Nurse and Staff accounts are not allowed to delete referrals.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        referral = self.get_object()
        referral.is_deleted = True
        referral.deleted_at = timezone.now()
        referral.deleted_by = request.user
        referral.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by', 'updated_at'])
        audit_log(
            request,
            'delete',
            'Referral',
            f'Deleted referral: {referral.referral_code}',
            target_id=referral.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _save_with_patient_sync(self, serializer, **extra_kwargs):
        """
        Keep Referral linked fields in sync:
        - linked patient => barangay follows patient, walk-in copies cleared
        - walk-in referral => keep manually entered walk-in data
        """
        patient = serializer.validated_data.get('patient')
        if patient:
            serializer.save(
                barangay=patient.barangay,
                walkin_name='',
                walkin_age='',
                walkin_address='',
                **extra_kwargs
            )
            return serializer.instance

        return serializer.save(**extra_kwargs)

    @action(detail=False, methods=['get'], url_path='lookup-by-code')
    def lookup_by_code(self, request):
        """Resolve a scanned QR referral code to patient vs walk-in routing data."""
        code = request.query_params.get('code', '').strip()
        if not code:
            return Response({'detail': 'Query parameter "code" is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            referral = Referral.objects.select_related('patient').get(referral_code__iexact=code, is_deleted=False)
        except Referral.DoesNotExist:
            return Response({'detail': 'Referral not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Pending → Completed when QR is scanned at the receiving facility
        if referral.status == 'pending':
            referral.status = 'completed'
            referral.save(update_fields=['status', 'updated_at'])
        audit_log(
            request,
            'qr_scan',
            'Referral',
            f'Scanned QR referral: {referral.referral_code}',
            target_id=referral.id,
        )

        has_patient = referral.patient_id is not None
        payload = {
            'referral_id': referral.id,
            'referral_code': referral.referral_code,
            'status': referral.status,
            'has_registered_patient': has_patient,
            'patient': PatientSerializer(referral.patient).data if has_patient else None,
            'walkin_prefill': None if has_patient else {
                'walkin_name': referral.walkin_name,
                'walkin_age': referral.walkin_age,
                'walkin_address': referral.walkin_address,
                'barangay': referral.barangay,
            },
        }
        return Response(payload)

    @action(detail=False, methods=['get'], url_path='trash')
    def trash(self, request):
        self._require_admin()
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        self._require_admin()
        referral = get_object_or_404(Referral, pk=pk, is_deleted=True)
        referral.is_deleted = False
        referral.deleted_at = None
        referral.deleted_by = None
        referral.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by', 'updated_at'])
        audit_log(
            request,
            'restore',
            'Referral',
            f'Restored referral: {referral.referral_code}',
            target_id=referral.id,
        )
        return Response(self.get_serializer(referral).data)