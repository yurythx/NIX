from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.mangas.models import Manga, Chapter
from apps.mangas.serializers import MangaSerializer, ChapterSerializer, ChapterCommentSerializer
from django.utils import timezone

@api_view(['GET'])
@permission_classes([AllowAny])
def list_mangas(request):
    """
    Endpoint simplificado para listar mangás.
    Não requer autenticação.
    """
    try:
        # Obter parâmetros de ordenação e filtragem
        ordering = request.query_params.get('ordering', '-created_at')
        search = request.query_params.get('search')
        
        # Obter todos os mangás
        mangas = Manga.objects.all()
        
        # Aplicar busca por título, descrição ou autor
        if search:
            mangas = mangas.filter(title__icontains=search) | \
                    mangas.filter(description__icontains=search) | \
                    mangas.filter(author__icontains=search)
        
        # Aplicar ordenação
        mangas = mangas.order_by(ordering)
        
        # Serializar os mangás
        serializer = MangaSerializer(mangas, many=True, context={'request': request})
        
        # Retornar os dados serializados
        return Response(serializer.data)
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao listar mangás: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao listar os mangás. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_manga(request, slug):
    """
    Endpoint simplificado para obter um mangá pelo slug.
    Não requer autenticação.
    """
    try:
        # Obter o mangá pelo slug
        manga = Manga.objects.get(slug=slug)
        
        # Serializar o mangá
        serializer = MangaSerializer(manga, context={'request': request})
        
        # Retornar os dados serializados
        return Response(serializer.data)
    except Manga.DoesNotExist:
        return Response(
            {"detail": "Mangá não encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao obter mangá: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao obter o mangá. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_chapter(request, manga_slug, chapter_number):
    """
    Endpoint simplificado para obter um capítulo de mangá.
    Não requer autenticação.
    """
    try:
        # Obter o mangá pelo slug
        manga = Manga.objects.get(slug=manga_slug)
        
        # Obter o capítulo pelo número
        chapter = Chapter.objects.get(manga=manga, number=chapter_number)
        
        # Serializar o capítulo
        serializer = ChapterSerializer(chapter, context={'request': request})
        
        # Retornar os dados serializados
        return Response(serializer.data)
    except Manga.DoesNotExist:
        return Response(
            {"detail": "Mangá não encontrado."},
            status=404
        )
    except Chapter.DoesNotExist:
        return Response(
            {"detail": "Capítulo não encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao obter capítulo: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao obter o capítulo. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def increment_views(request, slug):
    """
    Endpoint simplificado para incrementar o contador de visualizações de um mangá.
    Não requer autenticação.
    """
    try:
        # Obter o mangá pelo slug
        manga = Manga.objects.get(slug=slug)
        
        # Incrementar o contador de visualizações
        manga.views_count = manga.views_count + 1 if hasattr(manga, 'views_count') else 1
        manga.save(update_fields=['views_count'])
        
        # Retornar uma resposta de sucesso
        return Response({"success": True, "views_count": manga.views_count})
    except Manga.DoesNotExist:
        return Response(
            {"detail": "Mangá não encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao incrementar visualizações do mangá: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao incrementar as visualizações do mangá. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_chapter_comments(request, chapter_id):
    """
    Endpoint simplificado para obter os comentários de um capítulo.
    Não requer autenticação.
    """
    try:
        # Obter o capítulo pelo ID
        try:
            chapter = Chapter.objects.get(id=chapter_id)
            print(f"Capítulo encontrado: {chapter.id} - {chapter.title}")
            
            # Obter os comentários do capítulo
            # Nota: Ajuste isso de acordo com o modelo real de comentários de capítulos
            if hasattr(chapter, 'comments'):
                comments = chapter.comments.all().order_by('-created_at')
                print(f"Encontrados {comments.count()} comentários para o capítulo")
                
                # Serializar os comentários
                serializer = ChapterCommentSerializer(comments, many=True)
                
                # Retornar os dados serializados
                return Response(serializer.data)
            else:
                print(f"O capítulo não tem comentários ou o modelo não suporta comentários")
                return Response([])
        except Chapter.DoesNotExist:
            print(f"Capítulo não encontrado: id={chapter_id}")
            # Retornar uma lista vazia em vez de erro 404
            return Response([])
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao obter comentários do capítulo: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma lista vazia em vez de erro 500
        return Response([])

@api_view(['GET'])
@permission_classes([AllowAny])
def get_favorites(request):
    """
    Endpoint simplificado para obter os mangás favoritos do usuário.
    Se o usuário não estiver autenticado, retorna uma lista vazia.
    """
    try:
        # Verificar se o usuário está autenticado
        if not request.user.is_authenticated:
            # Retornar uma lista vazia para usuários não autenticados
            print("Usuário não autenticado, retornando lista vazia de favoritos")
            return Response([])
        
        # Obter os mangás favoritos do usuário
        # Nota: Ajuste isso de acordo com o modelo real de favoritos de mangás
        if hasattr(Manga, 'favorites'):
            favorites = Manga.objects.filter(favorites=request.user).order_by('-created_at')
            
            # Serializar os mangás
            serializer = MangaSerializer(favorites, many=True, context={'request': request})
            
            # Retornar os dados serializados
            return Response(serializer.data)
        else:
            print("O modelo de mangá não suporta favoritos")
            return Response([])
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao obter mangás favoritos: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao obter os mangás favoritos. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def toggle_favorite(request, slug):
    """
    Endpoint simplificado para adicionar/remover um mangá dos favoritos.
    Requer autenticação.
    """
    try:
        # Verificar se o usuário está autenticado
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Autenticação necessária para favoritar mangás."},
                status=401
            )
        
        # Obter o mangá pelo slug
        manga = Manga.objects.get(slug=slug)
        
        # Verificar se o mangá já está nos favoritos
        # Nota: Ajuste isso de acordo com o modelo real de favoritos de mangás
        if hasattr(manga, 'favorites'):
            is_favorite = manga.favorites.filter(id=request.user.id).exists()
            
            # Adicionar ou remover dos favoritos
            if is_favorite:
                manga.favorites.remove(request.user)
                action = "removed"
            else:
                manga.favorites.add(request.user)
                action = "added"
            
            # Retornar uma resposta de sucesso
            return Response({
                "success": True,
                "action": action,
                "is_favorite": not is_favorite
            })
        else:
            return Response(
                {"detail": "Este mangá não suporta a funcionalidade de favoritos."},
                status=400
            )
    except Manga.DoesNotExist:
        return Response(
            {"detail": "Mangá não encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao favoritar mangá: {str(e)}")
        print(traceback.format_exc())
        
        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao favoritar o mangá. Por favor, tente novamente mais tarde."},
            status=500
        )
