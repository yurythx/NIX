from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from apps.accounts.serializers import UserSerializer, UserDetailSerializer

User = get_user_model()

@api_view(['GET'])
@permission_classes([AllowAny])
def list_users(request):
    """
    Endpoint simplificado para listar usuarios.
    Nao requer autenticacao e nao depende do servico de usuario.
    """
    try:
        # Obter todos os usuarios
        users = User.objects.all().order_by('-created_at')
        
        # Serializar os usuarios
        serializer = UserSerializer(users, many=True)
        
        # Retornar os dados serializados
        return Response(serializer.data)
    except Exception as e:
        # Log detalhado do erro para depuracao
        import traceback
        print(f"Erro ao listar usuarios: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigavel
        return Response(
            {"detail": "Ocorreu um erro ao listar os usuarios. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_user(request, slug):
    """
    Endpoint simplificado para obter um usuario pelo slug.
    Nao requer autenticacao e nao depende do servico de usuario.
    """
    try:
        # Obter o usuario pelo slug
        user = User.objects.get(slug=slug)
        
        # Serializar o usuario
        serializer = UserDetailSerializer(user)
        
        # Retornar os dados serializados
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response(
            {"detail": "Usuario nao encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuracao
        import traceback
        print(f"Erro ao obter usuario: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigavel
        return Response(
            {"detail": "Ocorreu um erro ao obter o usuario. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def create_user(request):
    """
    Endpoint simplificado para criar um usuario.
    Nao requer autenticacao e nao depende do servico de usuario.
    """
    from apps.accounts.serializers import UserCreateSerializer
    
    try:
        # Serializar os dados da requisicao
        serializer = UserCreateSerializer(data=request.data)
        
        # Validar os dados
        if serializer.is_valid():
            # Criar o usuario
            user = serializer.save()
            
            # Retornar os dados do usuario criado
            return Response(UserSerializer(user).data, status=201)
        
        # Retornar os erros de validacao
        return Response(serializer.errors, status=400)
    except Exception as e:
        # Log detalhado do erro para depuracao
        import traceback
        print(f"Erro ao criar usuario: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigavel
        return Response(
            {"detail": "Ocorreu um erro ao criar o usuario. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny])
def update_user(request, slug):
    """
    Endpoint simplificado para atualizar um usuario pelo slug.
    Nao requer autenticacao e nao depende do servico de usuario.
    """
    try:
        # Obter o usuario pelo slug
        user = User.objects.get(slug=slug)
        
        # Serializar os dados da requisicao
        serializer = UserSerializer(user, data=request.data, partial=True)
        
        # Validar os dados
        if serializer.is_valid():
            # Atualizar o usuario
            user = serializer.save()
            
            # Retornar os dados do usuario atualizado
            return Response(UserSerializer(user).data)
        
        # Retornar os erros de validacao
        return Response(serializer.errors, status=400)
    except User.DoesNotExist:
        return Response(
            {"detail": "Usuario nao encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuracao
        import traceback
        print(f"Erro ao atualizar usuario: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigavel
        return Response(
            {"detail": "Ocorreu um erro ao atualizar o usuario. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_user(request, slug):
    """
    Endpoint simplificado para excluir um usuario pelo slug.
    Nao requer autenticacao e nao depende do servico de usuario.
    """
    try:
        # Obter o usuario pelo slug
        user = User.objects.get(slug=slug)
        
        # Excluir o usuario
        user.delete()
        
        # Retornar uma resposta de sucesso
        return Response(status=204)
    except User.DoesNotExist:
        return Response(
            {"detail": "Usuario nao encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuracao
        import traceback
        print(f"Erro ao excluir usuario: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigavel
        return Response(
            {"detail": "Ocorreu um erro ao excluir o usuario. Por favor, tente novamente mais tarde."},
            status=500
        )
