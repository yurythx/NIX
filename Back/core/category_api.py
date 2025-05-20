from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.categories.models import Category
from apps.categories.serializers import CategorySerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def list_categories(request):
    """
    Endpoint simplificado para listar categorias.
    Nao requer autenticacao.
    """
    try:
        # Obter todas as categorias
        categories = Category.objects.all().order_by('name')
        
        # Serializar as categorias
        serializer = CategorySerializer(categories, many=True)
        
        # Retornar os dados serializados
        return Response(serializer.data)
    except Exception as e:
        # Log detalhado do erro para depuracao
        import traceback
        print(f"Erro ao listar categorias: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigavel
        return Response(
            {"detail": "Ocorreu um erro ao listar as categorias. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_category(request, slug):
    """
    Endpoint simplificado para obter uma categoria pelo slug.
    Nao requer autenticacao.
    """
    try:
        # Obter a categoria pelo slug
        category = Category.objects.get(slug=slug)
        
        # Serializar a categoria
        serializer = CategorySerializer(category)
        
        # Retornar os dados serializados
        return Response(serializer.data)
    except Category.DoesNotExist:
        return Response(
            {"detail": "Categoria nao encontrada."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuracao
        import traceback
        print(f"Erro ao obter categoria: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigavel
        return Response(
            {"detail": "Ocorreu um erro ao obter a categoria. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def create_category(request):
    """
    Endpoint simplificado para criar uma categoria.
    Nao requer autenticacao.
    """
    try:
        # Serializar os dados da requisicao
        serializer = CategorySerializer(data=request.data)
        
        # Validar os dados
        if serializer.is_valid():
            # Criar a categoria
            category = serializer.save()
            
            # Retornar os dados da categoria criada
            return Response(CategorySerializer(category).data, status=201)
        
        # Retornar os erros de validacao
        return Response(serializer.errors, status=400)
    except Exception as e:
        # Log detalhado do erro para depuracao
        import traceback
        print(f"Erro ao criar categoria: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigavel
        return Response(
            {"detail": "Ocorreu um erro ao criar a categoria. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny])
def update_category(request, slug):
    """
    Endpoint simplificado para atualizar uma categoria pelo slug.
    Nao requer autenticacao.
    """
    try:
        # Obter a categoria pelo slug
        category = Category.objects.get(slug=slug)
        
        # Serializar os dados da requisicao
        serializer = CategorySerializer(category, data=request.data, partial=True)
        
        # Validar os dados
        if serializer.is_valid():
            # Atualizar a categoria
            category = serializer.save()
            
            # Retornar os dados da categoria atualizada
            return Response(CategorySerializer(category).data)
        
        # Retornar os erros de validacao
        return Response(serializer.errors, status=400)
    except Category.DoesNotExist:
        return Response(
            {"detail": "Categoria nao encontrada."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuracao
        import traceback
        print(f"Erro ao atualizar categoria: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigavel
        return Response(
            {"detail": "Ocorreu um erro ao atualizar a categoria. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_category(request, slug):
    """
    Endpoint simplificado para excluir uma categoria pelo slug.
    Nao requer autenticacao.
    """
    try:
        # Obter a categoria pelo slug
        category = Category.objects.get(slug=slug)
        
        # Excluir a categoria
        category.delete()
        
        # Retornar uma resposta de sucesso
        return Response(status=204)
    except Category.DoesNotExist:
        return Response(
            {"detail": "Categoria nao encontrada."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuracao
        import traceback
        print(f"Erro ao excluir categoria: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigavel
        return Response(
            {"detail": "Ocorreu um erro ao excluir a categoria. Por favor, tente novamente mais tarde."},
            status=500
        )
