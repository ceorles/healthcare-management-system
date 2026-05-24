"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
# from users.views import test_connection 
from rest_framework_simplejwt.views import TokenRefreshView
from users.authentication import CustomTokenObtainPairView
from rest_framework.routers import DefaultRouter

from patients.views import PatientViewSet, get_map_data 
from appointments.views import AppointmentViewSet
from consultations.views import VitalSignsViewSet, PatientVisitViewSet
from prescriptions.views import PrescriptionViewSet
from referrals.views import ReferralViewSet
from core.views import (
    HealthAlertViewSet,
    AuditLogViewSet,
    ClinicInfoViewSet,
    CoreValueViewSet,
    ServiceCategoryViewSet,
    ClinicScheduleViewSet,
    AnalyticsDashboardView,
)
from users.views import StaffViewSet

# Router for every API
router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'vitals', VitalSignsViewSet, basename='vitals')
router.register(r'visits', PatientVisitViewSet, basename='visit')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')
router.register(r'referrals', ReferralViewSet, basename='referral')
router.register(r'health-alerts', HealthAlertViewSet, basename='health-alert')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')  
router.register(r'staff', StaffViewSet, basename='staff')

# Landing
router.register(r'clinic-info', ClinicInfoViewSet, basename='clinic-info')
router.register(r'core-values', CoreValueViewSet, basename='core-values')
router.register(r'services-cms', ServiceCategoryViewSet, basename='services-cms')
router.register(r'schedules', ClinicScheduleViewSet, basename='schedule')

urlpatterns =[
    path('admin/', admin.site.urls),
    # path('users/test/', test_connection),

    # For authentication
    path('api/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Users App URLs
    path('api/users/', include('users.urls')), 

    path('api/patients/map-data/', get_map_data, name='map-data'),
    path('api/analytics/dashboard/', AnalyticsDashboardView.as_view(), name='analytics-dashboard'),

    # API bundled
    path('api/', include(router.urls)),
]