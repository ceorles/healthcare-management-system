from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import VitalSigns, PatientVisit
from .serializers import VitalSignsSerializer, PatientVisitSerializer

class VitalSignsViewSet(viewsets.ModelViewSet):
    queryset = VitalSigns.objects.all()
    serializer_class = VitalSignsSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)

class PatientVisitViewSet(viewsets.ModelViewSet):
    queryset = PatientVisit.objects.all()
    serializer_class = PatientVisitSerializer
    permission_classes = [IsAuthenticated]

    # If a doctor creates the visit, assign them as the doctor!
    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'DOCTOR':
            serializer.save(doctor=user)
        elif user.role == 'NURSE':
            serializer.save(nurse=user)
        else:
            serializer.save()
