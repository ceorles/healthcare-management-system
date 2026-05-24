from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User
from .serializers import (
    PublicRegisterSerializer,
    AdminStaffCreateSerializer,
    UserSerializer,
    ProfileUpdateSerializer,
    ChangePasswordSerializer,
)


def _require_admin(user):
    if not user.is_authenticated or user.role != 'ADMIN':
        raise PermissionDenied('Only administrators can perform this action.')


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)

    def get_permissions(self):
        if self.request.user and self.request.user.is_authenticated and self.request.user.role == 'ADMIN':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.request.user and self.request.user.is_authenticated and self.request.user.role == 'ADMIN':
            return AdminStaffCreateSerializer
        return PublicRegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        is_admin_create = (
            request.user.is_authenticated and request.user.role == 'ADMIN'
        )
        if is_admin_create:
            message = 'Staff account created and verified successfully.'
        else:
            message = (
                'Registration submitted successfully. '
                'Your account is pending admin verification.'
            )
        return Response(
            {
                'message': message,
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProfileUpdateSerializer
        return UserSerializer


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['current_password']):
            return Response(
                {'current_password': ['Current password is incorrect.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password updated successfully.'})


class StaffViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='verify')
    def verify_account(self, request, pk=None):
        _require_admin(request.user)
        user = self.get_object()
        if user.verification_status == 'VERIFIED' and user.is_active:
            return Response(
                {'detail': 'Account is already verified.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.verification_status = 'VERIFIED'
        user.is_active = True
        user.rejection_reason = ''
        user.save(update_fields=['verification_status', 'is_active', 'rejection_reason'])
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_account(self, request, pk=None):
        _require_admin(request.user)
        user = self.get_object()
        reason = (request.data.get('reason') or '').strip()
        user.verification_status = 'REJECTED'
        user.is_active = False
        user.rejection_reason = reason or 'Registration not approved by administrator.'
        user.save(update_fields=['verification_status', 'is_active', 'rejection_reason'])
        return Response(UserSerializer(user).data)
