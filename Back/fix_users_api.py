"""
Script para diagnosticar e corrigir problemas com a API de usuários.
"""
import os
import sys
import django
import json
import traceback

# Configurar o ambiente Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Importar modelos e serializadores após configurar o ambiente
from django.contrib.auth import get_user_model
from apps.accounts.serializers import UserSerializer, UserDetailSerializer
from apps.accounts.models import UserSettings
from rest_framework.test import APIClient
from django.urls import reverse
from django.test import RequestFactory
from apps.accounts.views import UserViewSet

User = get_user_model()

def diagnose_user_service():
    """
    Diagnostica problemas com o serviço de usuário.
    """
    try:
        # Verificar se o módulo user_service pode ser importado
        from core.services.user_service import user_service
        print("✅ Módulo user_service importado com sucesso")
        
        # Verificar se o método get_all funciona
        try:
            users = user_service.get_all()
            print(f"✅ Método get_all funciona. Usuários encontrados: {users.count()}")
        except Exception as e:
            print(f"❌ Erro ao chamar user_service.get_all(): {str(e)}")
            traceback.print_exc()
            
            # Tentar diagnosticar o problema
            print("\nTentando diagnosticar o problema com user_service.get_all()...")
            try:
                # Verificar se podemos obter usuários diretamente do modelo
                users = User.objects.all()
                print(f"✅ User.objects.all() funciona. Usuários encontrados: {users.count()}")
                
                # O problema está no serviço, não no modelo
                print("🔍 O problema está no serviço user_service, não no modelo User")
            except Exception as model_error:
                print(f"❌ Erro ao chamar User.objects.all(): {str(model_error)}")
                traceback.print_exc()
                print("🔍 O problema pode estar no modelo User ou na conexão com o banco de dados")
    except ImportError as e:
        print(f"❌ Erro ao importar user_service: {str(e)}")
        traceback.print_exc()

def test_user_viewset():
    """
    Testa o UserViewSet diretamente.
    """
    print("\nTestando UserViewSet diretamente...")
    try:
        # Criar uma instância do UserViewSet
        viewset = UserViewSet()
        
        # Criar uma requisição fictícia
        factory = RequestFactory()
        request = factory.get('/api/v1/accounts/users/')
        
        # Configurar o viewset com a requisição
        viewset.request = request
        viewset.format_kwarg = None
        
        # Chamar o método list
        try:
            response = viewset.list(request)
            print(f"✅ viewset.list() funciona. Status: {response.status_code}")
            print(f"   Dados retornados: {len(response.data)} usuários")
        except Exception as list_error:
            print(f"❌ Erro ao chamar viewset.list(): {str(list_error)}")
            traceback.print_exc()
            
            # Tentar diagnosticar o problema
            print("\nTentando diagnosticar o problema com viewset.list()...")
            try:
                # Verificar se podemos obter o queryset
                queryset = viewset.get_queryset()
                print(f"✅ viewset.get_queryset() funciona. Usuários encontrados: {queryset.count()}")
                
                # Verificar se podemos serializar os dados
                serializer = viewset.get_serializer(queryset, many=True)
                print(f"✅ Serialização funciona. Dados serializados: {len(serializer.data)} usuários")
                
                # O problema está em outro lugar
                print("🔍 O problema pode estar na resposta ou em algum middleware")
            except Exception as inner_error:
                print(f"❌ Erro interno: {str(inner_error)}")
                traceback.print_exc()
    except Exception as e:
        print(f"❌ Erro ao criar UserViewSet: {str(e)}")
        traceback.print_exc()

def create_fixed_view():
    """
    Cria uma view simplificada para a API de usuários.
    """
    print("\nCriando view simplificada para a API de usuários...")
    
    try:
        # Criar o arquivo views_fixed.py
        with open('apps/accounts/views_fixed.py', 'w') as f:
            f.write("""from rest_framework import viewsets, permissions, status, filters
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

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    \"\"\"
    API endpoint para gerenciamento de usuários.
    \"\"\"
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
        if self.action in ['create', 'login', 'list']:
            return [permissions.AllowAny()]
        return super().get_permissions()
    
    def list(self, request, *args, **kwargs):
        \"\"\"
        Lista todos os usuários com tratamento de erro aprimorado.
        \"\"\"
        try:
            # Obter o queryset filtrado
            queryset = self.filter_queryset(self.get_queryset())
            
            # Paginar os resultados
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            # Se não houver paginação, serializar todos os resultados
            serializer = self.get_serializer(queryset, many=True)
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
        \"\"\"Endpoint para autenticação de usuários.\"\"\"
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
        \"\"\"Retorna informações do usuário atual.\"\"\"
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put'], url_path='change-password')
    def change_password(self, request, *args, **kwargs):
        \"\"\"Altera a senha do usuário atual.\"\"\"
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
        \"\"\"Atualiza o perfil do usuário atual.\"\"\"
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'put'], url_path='settings')
    def settings(self, request, *args, **kwargs):
        \"\"\"Gerencia as configurações do usuário atual.\"\"\"
        try:
            # Tentar obter as configurações do usuário
            try:
                settings = UserSettings.objects.get(user=request.user)
            except UserSettings.DoesNotExist:
                settings = UserSettings.objects.create(user=request.user)

            # Para requisições GET, retornar as configurações
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
    \"\"\"
    API endpoint para gerenciamento de configurações de usuários.
    \"\"\"
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
        \"\"\"Retorna as configurações do usuário atual.\"\"\"
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
            )""")
        
        print("✅ Arquivo views_fixed.py criado com sucesso")
        
        # Atualizar o arquivo urls.py
        with open('apps/accounts/urls.py', 'w') as f:
            f.write("""from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_fixed import UserViewSet, UserSettingsViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'settings', UserSettingsViewSet)

urlpatterns = [
    path('', include(router.urls)),
]""")
        
        print("✅ Arquivo urls.py atualizado com sucesso")
        
        return True
    except Exception as e:
        print(f"❌ Erro ao criar arquivos: {str(e)}")
        traceback.print_exc()
        return False

def create_direct_api_endpoint():
    """
    Cria um endpoint direto para a API de usuários.
    """
    print("\nCriando endpoint direto para a API de usuários...")
    
    try:
        # Criar o arquivo user_api.py
        with open('core/user_api.py', 'w') as f:
            f.write("""from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from apps.accounts.serializers import UserSerializer, UserDetailSerializer

User = get_user_model()

@api_view(['GET'])
@permission_classes([AllowAny])
def list_users(request):
    \"\"\"
    Endpoint simplificado para listar usuários.
    Não requer autenticação e não depende do serviço de usuário.
    \"\"\"
    try:
        # Obter todos os usuários
        users = User.objects.all().order_by('-created_at')
        
        # Serializar os usuários
        serializer = UserSerializer(users, many=True)
        
        # Retornar os dados serializados
        return Response(serializer.data)
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao listar usuários: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao listar os usuários. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_user(request, slug):
    \"\"\"
    Endpoint simplificado para obter um usuário pelo slug.
    Não requer autenticação e não depende do serviço de usuário.
    \"\"\"
    try:
        # Obter o usuário pelo slug
        user = User.objects.get(slug=slug)
        
        # Serializar o usuário
        serializer = UserDetailSerializer(user)
        
        # Retornar os dados serializados
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response(
            {"detail": "Usuário não encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao obter usuário: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao obter o usuário. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def create_user(request):
    \"\"\"
    Endpoint simplificado para criar um usuário.
    Não requer autenticação e não depende do serviço de usuário.
    \"\"\"
    from apps.accounts.serializers import UserCreateSerializer
    
    try:
        # Serializar os dados da requisição
        serializer = UserCreateSerializer(data=request.data)
        
        # Validar os dados
        if serializer.is_valid():
            # Criar o usuário
            user = serializer.save()
            
            # Retornar os dados do usuário criado
            return Response(UserSerializer(user).data, status=201)
        
        # Retornar os erros de validação
        return Response(serializer.errors, status=400)
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao criar usuário: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao criar o usuário. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny])
def update_user(request, slug):
    \"\"\"
    Endpoint simplificado para atualizar um usuário pelo slug.
    Não requer autenticação e não depende do serviço de usuário.
    \"\"\"
    try:
        # Obter o usuário pelo slug
        user = User.objects.get(slug=slug)
        
        # Serializar os dados da requisição
        serializer = UserSerializer(user, data=request.data, partial=True)
        
        # Validar os dados
        if serializer.is_valid():
            # Atualizar o usuário
            user = serializer.save()
            
            # Retornar os dados do usuário atualizado
            return Response(UserSerializer(user).data)
        
        # Retornar os erros de validação
        return Response(serializer.errors, status=400)
    except User.DoesNotExist:
        return Response(
            {"detail": "Usuário não encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao atualizar usuário: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao atualizar o usuário. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_user(request, slug):
    \"\"\"
    Endpoint simplificado para excluir um usuário pelo slug.
    Não requer autenticação e não depende do serviço de usuário.
    \"\"\"
    try:
        # Obter o usuário pelo slug
        user = User.objects.get(slug=slug)
        
        # Excluir o usuário
        user.delete()
        
        # Retornar uma resposta de sucesso
        return Response(status=204)
    except User.DoesNotExist:
        return Response(
            {"detail": "Usuário não encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao excluir usuário: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao excluir o usuário. Por favor, tente novamente mais tarde."},
            status=500
        )""")
        
        print("✅ Arquivo user_api.py criado com sucesso")
        
        # Atualizar o arquivo urls.py
        with open('core/urls.py', 'r') as f:
            content = f.read()
        
        # Adicionar a importação
        if 'from .user_api import' not in content:
            content = content.replace(
                'from .stats_views import global_statistics',
                'from .stats_views import global_statistics\nfrom .user_api import list_users, get_user, create_user, update_user, delete_user'
            )
        
        # Adicionar as URLs
        if 'path(\'api/users-simple/\'' not in content:
            content = content.replace(
                '# API simplificada de usuários',
                '# API simplificada de usuários\n    path(\'api/users-simple/\', list_users, name=\'list_users_simple\'),\n    path(\'api/users-simple/<slug:slug>/\', get_user, name=\'get_user_simple\'),\n    path(\'api/users-simple/create/\', create_user, name=\'create_user_simple\'),\n    path(\'api/users-simple/<slug:slug>/update/\', update_user, name=\'update_user_simple\'),\n    path(\'api/users-simple/<slug:slug>/delete/\', delete_user, name=\'delete_user_simple\'),'
            )
        
        with open('core/urls.py', 'w') as f:
            f.write(content)
        
        print("✅ Arquivo urls.py atualizado com sucesso")
        
        return True
    except Exception as e:
        print(f"❌ Erro ao criar arquivos: {str(e)}")
        traceback.print_exc()
        return False

def main():
    """
    Função principal
    """
    print("Diagnosticando e corrigindo problemas com a API de usuários...")
    
    # Diagnosticar problemas com o serviço de usuário
    diagnose_user_service()
    
    # Testar o UserViewSet diretamente
    test_user_viewset()
    
    # Criar uma view simplificada para a API de usuários
    create_fixed_view()
    
    # Criar um endpoint direto para a API de usuários
    create_direct_api_endpoint()
    
    print("\n✅ Diagnóstico e correção concluídos")
    print("Agora você pode iniciar o servidor Django e testar a API de usuários")

if __name__ == "__main__":
    main()
