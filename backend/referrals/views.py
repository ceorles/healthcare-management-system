from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Referral
from .serializers import ReferralSerializer
from patients.serializers import PatientSerializer


class ReferralViewSet(viewsets.ModelViewSet):
    queryset = Referral.objects.all().order_by('-created_at')
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(referred_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='lookup-by-code')
    def lookup_by_code(self, request):
        """Resolve a scanned QR referral code to patient vs walk-in routing data."""
        code = request.query_params.get('code', '').strip()
        if not code:
            return Response({'detail': 'Query parameter "code" is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            referral = Referral.objects.select_related('patient').get(referral_code__iexact=code)
        except Referral.DoesNotExist:
            return Response({'detail': 'Referral not found.'}, status=status.HTTP_404_NOT_FOUND)

        has_patient = referral.patient_id is not None
        payload = {
            'referral_id': referral.id,
            'referral_code': referral.referral_code,
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