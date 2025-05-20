from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.books.models import Book
from apps.books.serializers import BookSerializer, BookCommentSerializer
from django.utils import timezone

@api_view(['GET'])
@permission_classes([AllowAny])
def list_books(request):
    """
    Endpoint simplificado para listar livros.
    Não requer autenticação.
    """
    try:
        # Obter parâmetros de ordenação e filtragem
        ordering = request.query_params.get('ordering', '-created_at')
        search = request.query_params.get('search')
        
        # Obter todos os livros
        books = Book.objects.all()
        
        # Aplicar busca por título ou descrição
        if search:
            books = books.filter(title__icontains=search) | books.filter(description__icontains=search)
        
        # Aplicar ordenação
        books = books.order_by(ordering)
        
        # Serializar os livros
        serializer = BookSerializer(books, many=True, context={'request': request})
        
        # Retornar os dados serializados
        return Response(serializer.data)
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao listar livros: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao listar os livros. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_book(request, slug):
    """
    Endpoint simplificado para obter um livro pelo slug.
    Não requer autenticação.
    """
    try:
        # Obter o livro pelo slug
        book = Book.objects.get(slug=slug)
        
        # Serializar o livro
        serializer = BookSerializer(book, context={'request': request})
        
        # Retornar os dados serializados
        return Response(serializer.data)
    except Book.DoesNotExist:
        return Response(
            {"detail": "Livro não encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao obter livro: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao obter o livro. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def increment_views(request, slug):
    """
    Endpoint simplificado para incrementar o contador de visualizações de um livro.
    Não requer autenticação.
    """
    try:
        # Obter o livro pelo slug
        book = Book.objects.get(slug=slug)
        
        # Incrementar o contador de visualizações
        book.views_count = book.views_count + 1 if hasattr(book, 'views_count') else 1
        book.save(update_fields=['views_count'])
        
        # Retornar uma resposta de sucesso
        return Response({"success": True, "views_count": book.views_count})
    except Book.DoesNotExist:
        return Response(
            {"detail": "Livro não encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao incrementar visualizações do livro: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao incrementar as visualizações do livro. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_comments(request):
    """
    Endpoint simplificado para obter os comentários de um livro.
    Não requer autenticação.
    """
    try:
        # Obter o slug do livro da query string
        book_slug = request.query_params.get('book_slug')
        book_id = request.query_params.get('book')
        
        if not book_slug and not book_id:
            return Response(
                {"detail": "É necessário fornecer book_slug ou book."},
                status=400
            )
        
        # Log para depuração
        print(f"Buscando comentários para book_slug={book_slug}, book_id={book_id}")
        
        try:
            # Obter o livro pelo slug ou ID
            if book_slug:
                book = Book.objects.get(slug=book_slug)
                print(f"Livro encontrado pelo slug: {book.id} - {book.title}")
            else:
                book = Book.objects.get(id=book_id)
                print(f"Livro encontrado pelo ID: {book.id} - {book.title}")
            
            # Obter os comentários do livro
            # Nota: Ajuste isso de acordo com o modelo real de comentários de livros
            if hasattr(book, 'comments'):
                comments = book.comments.all().order_by('-created_at')
                print(f"Encontrados {comments.count()} comentários para o livro")
                
                # Serializar os comentários
                serializer = BookCommentSerializer(comments, many=True)
                
                # Retornar os dados serializados
                return Response(serializer.data)
            else:
                print(f"O livro não tem comentários ou o modelo não suporta comentários")
                return Response([])
        except Book.DoesNotExist:
            print(f"Livro não encontrado: slug={book_slug}, id={book_id}")
            # Retornar uma lista vazia em vez de erro 404
            return Response([])
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao obter comentários do livro: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma lista vazia em vez de erro 500
        return Response([])

@api_view(['GET'])
@permission_classes([AllowAny])
def get_favorites(request):
    """
    Endpoint simplificado para obter os livros favoritos do usuário.
    Se o usuário não estiver autenticado, retorna uma lista vazia.
    """
    try:
        # Verificar se o usuário está autenticado
        if not request.user.is_authenticated:
            # Retornar uma lista vazia para usuários não autenticados
            print("Usuário não autenticado, retornando lista vazia de favoritos")
            return Response([])
        
        # Obter os livros favoritos do usuário
        # Nota: Ajuste isso de acordo com o modelo real de favoritos de livros
        if hasattr(Book, 'favorites'):
            favorites = Book.objects.filter(favorites=request.user).order_by('-created_at')
            
            # Serializar os livros
            serializer = BookSerializer(favorites, many=True, context={'request': request})
            
            # Retornar os dados serializados
            return Response(serializer.data)
        else:
            print("O modelo de livro não suporta favoritos")
            return Response([])
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao obter livros favoritos: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao obter os livros favoritos. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def toggle_favorite(request, slug):
    """
    Endpoint simplificado para adicionar/remover um livro dos favoritos.
    Requer autenticação.
    """
    try:
        # Verificar se o usuário está autenticado
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Autenticação necessária para favoritar livros."},
                status=401
            )
        
        # Obter o livro pelo slug
        book = Book.objects.get(slug=slug)
        
        # Verificar se o livro já está nos favoritos
        # Nota: Ajuste isso de acordo com o modelo real de favoritos de livros
        if hasattr(book, 'favorites'):
            is_favorite = book.favorites.filter(id=request.user.id).exists()
            
            # Adicionar ou remover dos favoritos
            if is_favorite:
                book.favorites.remove(request.user)
                action = "removed"
            else:
                book.favorites.add(request.user)
                action = "added"
            
            # Retornar uma resposta de sucesso
            return Response({
                "success": True,
                "action": action,
                "is_favorite": not is_favorite
            })
        else:
            return Response(
                {"detail": "Este livro não suporta a funcionalidade de favoritos."},
                status=400
            )
    except Book.DoesNotExist:
        return Response(
            {"detail": "Livro não encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao favoritar livro: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao favoritar o livro. Por favor, tente novamente mais tarde."},
            status=500
        )
