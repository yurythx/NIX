from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from apps.articles.models import Article, Tag, Comment
from apps.articles.serializers import ArticleSerializer, TagSerializer, CommentSerializer
from django.utils import timezone
from django.db.models import Q
import logging

# Configurar logger
logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def list_articles(request):
    """
    Endpoint simplificado para listar artigos.
    Não requer autenticação.

    Parâmetros de consulta:
    - ordering: Campo para ordenação (ex: -created_at, title)
    - category: Slug da categoria para filtrar
    - search: Termo de busca para título ou conteúdo
    - featured: Se True, retorna apenas artigos em destaque
    - limit: Número máximo de artigos a retornar
    """
    try:
        # Obter parâmetros de ordenação e filtragem
        ordering = request.query_params.get('ordering', '-created_at')
        category = request.query_params.get('category')
        search = request.query_params.get('search')
        featured = request.query_params.get('featured')
        limit = request.query_params.get('limit')

        logger.info(f"Listando artigos com parâmetros: ordering={ordering}, category={category}, search={search}, featured={featured}, limit={limit}")

        # Obter todos os artigos
        articles = Article.objects.all()

        # Aplicar filtragem por categoria
        if category:
            articles = articles.filter(category__slug=category)
            logger.debug(f"Filtrando por categoria: {category}")

        # Aplicar filtragem por destaque
        if featured and featured.lower() == 'true':
            articles = articles.filter(featured=True)
            logger.debug("Filtrando apenas artigos em destaque")

        # Aplicar busca por título ou conteúdo
        if search:
            articles = articles.filter(
                Q(title__icontains=search) |
                Q(content__icontains=search)
            )
            logger.debug(f"Aplicando busca por: {search}")

        # Aplicar ordenação
        articles = articles.order_by(ordering)

        # Aplicar limite se especificado
        if limit and limit.isdigit():
            articles = articles[:int(limit)]
            logger.debug(f"Limitando a {limit} artigos")

        # Serializar os artigos
        serializer = ArticleSerializer(articles, many=True, context={'request': request})

        logger.info(f"Retornando {len(serializer.data)} artigos")

        # Retornar os dados serializados
        return Response(serializer.data)
    except Exception as e:
        logger.exception(f"Erro ao listar artigos: {str(e)}")

        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao listar os artigos. Por favor, tente novamente mais tarde."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_article(request, slug):
    """
    Endpoint simplificado para obter um artigo pelo slug.
    Não requer autenticação.

    Parâmetros:
    - slug: Slug único do artigo

    Retorna:
    - Detalhes completos do artigo
    """
    try:
        logger.info(f"Buscando artigo com slug: {slug}")

        # Obter o artigo pelo slug
        article = Article.objects.get(slug=slug)
        logger.debug(f"Artigo encontrado: {article.id} - {article.title}")

        # Serializar o artigo
        serializer = ArticleSerializer(article, context={'request': request})
        logger.info(f"Retornando artigo: {article.title}")

        # Retornar os dados serializados
        return Response(serializer.data)
    except Article.DoesNotExist:
        logger.warning(f"Artigo não encontrado com slug: {slug}")
        return Response(
            {"detail": "Artigo não encontrado."},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.exception(f"Erro ao obter artigo com slug {slug}: {str(e)}")

        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao obter o artigo. Por favor, tente novamente mais tarde."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def create_article(request):
    """
    Endpoint simplificado para criar um artigo.
    Não requer autenticação, mas em um ambiente de produção real deveria requerer.

    Corpo da requisição:
    - title: Título do artigo (obrigatório)
    - content: Conteúdo do artigo (obrigatório)
    - category_id: ID da categoria (opcional)
    - featured: Se o artigo deve ser destacado (opcional)
    - tag_names: Lista de nomes de tags (opcional)
    - cover_image: Imagem de capa (opcional)

    Retorna:
    - Artigo criado com status 201
    - Erros de validação com status 400
    """
    try:
        logger.info("Criando novo artigo")
        logger.debug(f"Dados recebidos: {request.data}")

        # Serializar os dados da requisição
        serializer = ArticleSerializer(data=request.data, context={'request': request})

        # Validar os dados
        if serializer.is_valid():
            # Criar o artigo
            article = serializer.save()
            logger.info(f"Artigo criado com sucesso: {article.id} - {article.title}")

            # Retornar os dados do artigo criado
            return Response(
                ArticleSerializer(article, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )

        # Registrar erros de validação
        logger.warning(f"Erro de validação ao criar artigo: {serializer.errors}")

        # Retornar os erros de validação
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.exception(f"Erro ao criar artigo: {str(e)}")

        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao criar o artigo. Por favor, tente novamente mais tarde."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny])
def update_article(request, slug):
    """
    Endpoint simplificado para atualizar um artigo pelo slug.
    Nao requer autenticacao.
    """
    try:
        # Obter o artigo pelo slug
        article = Article.objects.get(slug=slug)

        # Serializar os dados da requisição
        serializer = ArticleSerializer(article, data=request.data, partial=True, context={'request': request})

        # Validar os dados
        if serializer.is_valid():
            # Atualizar o artigo
            article = serializer.save()

            # Retornar os dados do artigo atualizado
            return Response(ArticleSerializer(article, context={'request': request}).data)

        # Retornar os erros de validação
        return Response(serializer.errors, status=400)
    except Article.DoesNotExist:
        return Response(
            {"detail": "Artigo nao encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuracao
        import traceback
        print(f"Erro ao atualizar artigo: {str(e)}")
        print(traceback.format_exc())

        # Retornar uma resposta de erro mais amigavel
        return Response(
            {"detail": "Ocorreu um erro ao atualizar o artigo. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_article(request, slug):
    """
    Endpoint simplificado para excluir um artigo pelo slug.
    Nao requer autenticacao.
    """
    try:
        # Obter o artigo pelo slug
        article = Article.objects.get(slug=slug)

        # Excluir o artigo
        article.delete()

        # Retornar uma resposta de sucesso
        return Response(status=204)
    except Article.DoesNotExist:
        return Response(
            {"detail": "Artigo nao encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuracao
        import traceback
        print(f"Erro ao excluir artigo: {str(e)}")
        print(traceback.format_exc())

        # Retornar uma resposta de erro mais amigavel
        return Response(
            {"detail": "Ocorreu um erro ao excluir o artigo. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def increment_views(request, slug):
    """
    Endpoint simplificado para incrementar o contador de visualizações de um artigo.
    Nao requer autenticacao.
    """
    try:
        # Obter o artigo pelo slug
        article = Article.objects.get(slug=slug)

        # Incrementar o contador de visualizações
        article.views_count += 1
        article.save(update_fields=['views_count'])

        # Retornar uma resposta de sucesso
        return Response({"success": True, "views_count": article.views_count})
    except Article.DoesNotExist:
        return Response(
            {"detail": "Artigo nao encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuracao
        import traceback
        print(f"Erro ao incrementar visualizações do artigo: {str(e)}")
        print(traceback.format_exc())

        # Retornar uma resposta de erro mais amigavel
        return Response(
            {"detail": "Ocorreu um erro ao incrementar as visualizações do artigo. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_comments(request):
    """
    Endpoint simplificado para obter os comentários de um artigo.
    Nao requer autenticacao.
    """
    try:
        # Obter o slug do artigo da query string
        article_slug = request.query_params.get('article_slug')
        article_id = request.query_params.get('article')

        if not article_slug and not article_id:
            return Response(
                {"detail": "É necessário fornecer article_slug ou article."},
                status=400
            )

        # Log para depuração
        print(f"Buscando comentários para article_slug={article_slug}, article_id={article_id}")

        try:
            # Obter o artigo pelo slug ou ID
            if article_slug:
                try:
                    article = Article.objects.get(slug=article_slug)
                    print(f"Artigo encontrado pelo slug: {article.id} - {article.title}")

                    # Obter os comentários do artigo
                    comments = Comment.objects.filter(article=article).order_by('-created_at')
                    print(f"Encontrados {comments.count()} comentários para o artigo")

                    # Serializar os comentários
                    serializer = CommentSerializer(comments, many=True)

                    # Retornar os dados serializados
                    return Response(serializer.data)
                except Article.DoesNotExist:
                    print(f"Artigo não encontrado pelo slug: {article_slug}")

                    # Tentar encontrar comentários pelo article_slug
                    comments = Comment.objects.filter(article_slug=article_slug).order_by('-created_at')
                    if comments.exists():
                        print(f"Encontrados {comments.count()} comentários pelo article_slug")
                        serializer = CommentSerializer(comments, many=True)
                        return Response(serializer.data)

                    # Se não encontrar, retornar lista vazia
                    return Response([])
            else:
                article = Article.objects.get(id=article_id)
                print(f"Artigo encontrado pelo ID: {article.id} - {article.title}")

                # Obter os comentários do artigo
                comments = Comment.objects.filter(article=article).order_by('-created_at')
                print(f"Encontrados {comments.count()} comentários para o artigo")

                # Serializar os comentários
                serializer = CommentSerializer(comments, many=True)

                # Retornar os dados serializados
                return Response(serializer.data)
        except Article.DoesNotExist:
            print(f"Artigo não encontrado: slug={article_slug}, id={article_id}")
            # Retornar uma lista vazia em vez de erro 404
            return Response([])
    except Exception as e:
        # Log detalhado do erro para depuracao
        import traceback
        print(f"Erro ao obter comentários do artigo: {str(e)}")
        print(traceback.format_exc())

        # Retornar uma lista vazia em vez de erro 500
        return Response([])

@api_view(['POST'])
@permission_classes([AllowAny])
def add_comment(request, slug):
    """
    Endpoint simplificado para adicionar um comentário a um artigo.
    Nao requer autenticacao.
    """
    try:
        # Obter o artigo pelo slug
        article = Article.objects.get(slug=slug)

        # Adicionar o artigo aos dados da requisição
        data = request.data.copy()
        data['article'] = article.id

        # Serializar os dados da requisição
        serializer = CommentSerializer(data=data)

        # Validar os dados
        if serializer.is_valid():
            # Criar o comentário
            comment = serializer.save()

            # Retornar os dados do comentário criado
            return Response(CommentSerializer(comment).data, status=201)

        # Retornar os erros de validação
        return Response(serializer.errors, status=400)
    except Article.DoesNotExist:
        return Response(
            {"detail": "Artigo nao encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuracao
        import traceback
        print(f"Erro ao adicionar comentário ao artigo: {str(e)}")
        print(traceback.format_exc())

        # Retornar uma resposta de erro mais amigavel
        return Response(
            {"detail": "Ocorreu um erro ao adicionar o comentário ao artigo. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_favorites(request):
    """
    Endpoint simplificado para obter os artigos favoritos do usuário.
    Se o usuário não estiver autenticado, retorna uma lista vazia.
    """
    try:
        # Verificar se o usuário está autenticado
        if not request.user.is_authenticated:
            # Retornar uma lista vazia para usuários não autenticados
            print("Usuário não autenticado, retornando lista vazia de favoritos")
            return Response([])

        # Obter os artigos favoritos do usuário
        favorites = Article.objects.filter(favorites=request.user).order_by('-created_at')

        # Serializar os artigos
        serializer = ArticleSerializer(favorites, many=True, context={'request': request})

        # Retornar os dados serializados
        return Response(serializer.data)
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao obter artigos favoritos: {str(e)}")
        print(traceback.format_exc())

        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao obter os artigos favoritos. Por favor, tente novamente mais tarde."},
            status=500
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def toggle_favorite(request, slug):
    """
    Endpoint simplificado para adicionar/remover um artigo dos favoritos.
    Requer autenticação.
    """
    try:
        # Verificar se o usuário está autenticado
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Autenticação necessária para favoritar artigos."},
                status=401
            )

        # Obter o artigo pelo slug
        article = Article.objects.get(slug=slug)

        # Verificar se o artigo já está nos favoritos
        is_favorite = article.favorites.filter(id=request.user.id).exists()

        # Adicionar ou remover dos favoritos
        if is_favorite:
            article.favorites.remove(request.user)
            action = "removed"
        else:
            article.favorites.add(request.user)
            action = "added"

        # Retornar uma resposta de sucesso
        return Response({
            "success": True,
            "action": action,
            "is_favorite": not is_favorite
        })
    except Article.DoesNotExist:
        return Response(
            {"detail": "Artigo não encontrado."},
            status=404
        )
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        print(f"Erro ao favoritar artigo: {str(e)}")
        print(traceback.format_exc())

        # Retornar uma resposta de erro mais amigável
        return Response(
            {"detail": "Ocorreu um erro ao favoritar o artigo. Por favor, tente novamente mais tarde."},
            status=500
        )
