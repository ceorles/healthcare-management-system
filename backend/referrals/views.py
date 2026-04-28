from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Referral
from .serializers import ReferralSerializer

class ReferralViewSet(viewsets.ModelViewSet):
    queryset = Referral.objects.all().order_by('-created_at')
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(referred_by=self.request.user)