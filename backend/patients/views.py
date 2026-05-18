from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Patient
from .serializers import PatientSerializer

from django.db.models import Count
from rest_framework.decorators import api_view, permission_classes # action
from rest_framework.response import Response

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-created_at')
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated] # Only logged-in users can view/edit

    # Automatically set the "created_by" to the logged-in user
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    # @action(detail=False, methods=['get'])
    # def map_data(self, request):
    #     data = Patient.objects.values('barangay').annotate(count=Count('id'))
    #     return Response(list(data))

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_map_data(request):
    data = Patient.objects.values('barangay').annotate(count=Count('id')).order_by('-count')
    return Response(list(data))