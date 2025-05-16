from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from django_filters.rest_framework import DjangoFilterBackend

from .serializers import (
    UserSerializer,
    UserDetailSerializer,
    UserCreateSerializer,
    PasswordChangeSerializer,
    UserSettingsSerializer,
    UserSettingsDetailSerializer
)
from .models import UserSettings
from core.services.user_service import user_service

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gerenciamento de usuários.
    """
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['username', 'email', 'position']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'position']
    ordering_fields = ['username', 'email', 'created_at', 'updated_at']
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action == 'retrieve':
            return UserDetailSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'login']:
            return [permissions.AllowAny()]
        return super().get_permissions()

    def list(self, request, *args, **kwargs):
        """
        Lista todos os usuários com tratamento de erro aprimorado.
        """
        try:
            # Usar o queryset padrão em vez do serviço para evitar problemas
            queryset = self.get_queryset()

            # Log para depuração
            print(f"Obtendo usuários. Total: {queryset.count()}")

            # Aplicar filtros
            queryset = self.filter_queryset(queryset)

            # Paginar os resultados
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            # Se não houver paginação, serializar todos os resultados
            serializer = self.get_serializer(queryset, many=True)

            # Log para depuração
            print(f"Dados serializados: {serializer.data[:2]}")

            return Response(serializer.data)

        except Exception as e:
            # Log detalhado do erro para depuração
            import traceback
            print(f"Erro ao listar usuários: {str(e)}")
            print(traceback.format_exc())

            # Retornar uma resposta de erro mais amigável
            return Response(
                {"detail": "Ocorreu um erro ao listar os usuários. Por favor, tente novamente mais tarde."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def login(self, request):
        """Endpoint para autenticação de usuários."""
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Por favor, forneça email e senha.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(email=email, password=password)

        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })

        return Response(
            {'error': 'Credenciais inválidas.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    @action(detail=False, methods=['get'])
    def me(self, request, *args, **kwargs):
        """Retorna informações do usuário atual."""
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put'], url_path='change-password')
    def change_password(self, request, *args, **kwargs):
        """Altera a senha do usuário atual."""
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Senha alterada com sucesso."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['put'], url_path='update-profile')
    def update_profile(self, request, *args, **kwargs):
        """Atualiza o perfil do usuário atual."""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'put'], url_path='settings')
    def settings(self, request, *args, **kwargs):
        """Gerencia as configurações do usuário atual."""
        try:
            # Tentar obter as configurações do usuário
            try:
                settings = UserSettings.objects.get(user=request.user)
            except UserSettings.DoesNotExist:
                # Se não existir, criar novas configurações
                settings = UserSettings.objects.create(user=request.user)

            if request.method == 'GET':
                serializer = UserSettingsDetailSerializer(settings)
                return Response(serializer.data)

            # Para requisições PUT, atualizar as configurações
            serializer = UserSettingsSerializer(settings, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            # Log detalhado do erro para depuração
            import traceback
            print(f"Erro ao processar configurações do usuário: {str(e)}")
            print(traceback.format_exc())

            # Retornar uma resposta de erro mais amigável
            return Response(
                {"detail": "Ocorreu um erro ao processar as configurações do usuário."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserSettingsViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gerenciamento de configurações de usuários.
    """
    queryset = UserSettings.objects.all()
    serializer_class = UserSettingsDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Usuários normais só podem ver suas próprias configurações
        if not self.request.user.is_staff:
            return UserSettings.objects.filter(user=self.request.user)
        # Administradores podem ver todas as configurações
        return UserSettings.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_settings(self, request):
        """Retorna as configurações do usuário atual."""
        try:
            try:
                settings = UserSettings.objects.get(user=request.user)
            except UserSettings.DoesNotExist:
                settings = UserSettings.objects.create(user=request.user)

            serializer = self.get_serializer(settings)
            return Response(serializer.data)

        except Exception as e:
            # Log detalhado do erro para depuração
            import traceback
            print(f"Erro ao obter configurações do usuário: {str(e)}")
            print(traceback.format_exc())

            # Retornar uma resposta de erro mais amigável
            return Response(
                {"detail": "Ocorreu um erro ao obter as configurações do usuário."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
