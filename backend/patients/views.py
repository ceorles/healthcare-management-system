from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Patient
from .serializers import PatientSerializer

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-created_at')
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated] # Only logged-in users can view/edit

    # Automatically set the "created_by" to the logged-in user
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
