from rest_framework import viewsets, permissions, status, filters
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from .models import Article, Tag, Comment
from .serializers import ArticleSerializer, TagSerializer, CommentSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .services import article_service
from django.core.cache import cache
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

class ArticlePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class TagPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

@extend_schema_view(
    list=extend_schema(
        summary="Listar artigos",
        description="Retorna uma lista paginada de artigos com suporte a filtragem, busca e ordenação.",
        parameters=[
            OpenApiParameter(name="category__slug", description="Filtrar por slug da categoria", type=str),
            OpenApiParameter(name="tags__slug", description="Filtrar por slug da tag", type=str),
            OpenApiParameter(name="featured", description="Filtrar por artigos em destaque", type=bool),
            OpenApiParameter(name="search", description="Buscar por título ou conteúdo", type=str),
            OpenApiParameter(name="ordering", description="Ordenar por campo (ex: -created_at, title)", type=str),
            OpenApiParameter(name="page", description="Número da página", type=int),
            OpenApiParameter(name="page_size", description="Tamanho da página", type=int),
        ],
        tags=["articles"],
    ),
    retrieve=extend_schema(
        summary="Obter artigo",
        description="Retorna os detalhes de um artigo específico pelo slug.",
        tags=["articles"],
    ),
    create=extend_schema(
        summary="Criar artigo",
        description="Cria um novo artigo. Requer autenticação.",
        tags=["articles"],
    ),
    update=extend_schema(
        summary="Atualizar artigo",
        description="Atualiza um artigo existente. Requer autenticação.",
        tags=["articles"],
    ),
    partial_update=extend_schema(
        summary="Atualizar artigo parcialmente",
        description="Atualiza parcialmente um artigo existente. Requer autenticação.",
        tags=["articles"],
    ),
    destroy=extend_schema(
        summary="Excluir artigo",
        description="Exclui um artigo existente. Requer autenticação.",
        tags=["articles"],
    ),
)
class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().select_related('category').prefetch_related('tags', 'favorites')
    serializer_class = ArticleSerializer
    lookup_field = 'slug'
    pagination_class = ArticlePagination
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'tags__slug', 'featured']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'updated_at', 'views_count', 'title']
    ordering = ['-created_at']

    def get_permissions(self):
        # Permitir leitura para todos, mas exigir autenticação para criar/editar/excluir
        if self.action in ['list', 'retrieve', 'increment_views']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def list(self, request, *args, **kwargs):
        """
        Lista todos os artigos com suporte a cache
        """
        # Verificar se a resposta está em cache
        cache_key = f"articles_list_{request.query_params.urlencode()}"
        cached_response = cache.get(cache_key)

        if cached_response and not request.query_params.get('nocache'):
            return Response(cached_response)

        # Aplicar filtros padrão
        queryset = self.filter_queryset(self.get_queryset())

        # Paginação
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            # Armazenar em cache por 5 minutos (300 segundos)
            cache.set(cache_key, response.data, 300)
            return response

        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        # Armazenar em cache por 5 minutos (300 segundos)
        cache.set(cache_key, data, 300)
        return Response(data)

    @extend_schema(
        summary="Incrementar visualizações",
        description="Incrementa o contador de visualizações de um artigo.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["articles"],
    )
    @action(detail=True, methods=['post'])
    def increment_views(self, request, slug=None):
        article = self.get_object()
        # Usar o serviço para incrementar visualizações
        article_service.view_article(article.id)
        return Response({
            'status': 'success',
            'views_count': article.views_count
        })

    @extend_schema(
        summary="Favoritar/Desfavoritar artigo",
        description="Adiciona ou remove um artigo dos favoritos do usuário atual.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["articles"],
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def favorite(self, request, slug=None):
        article = self.get_object()
        user = request.user

        # Usar o serviço para favoritar/desfavoritar
        is_favorite = article_service.toggle_favorite_article(article.id, user.id)

        return Response({
            'status': 'added to favorites' if is_favorite else 'removed from favorites',
            'is_favorite': is_favorite
        })

    @extend_schema(
        summary="Listar artigos favoritos",
        description="Retorna uma lista paginada de artigos favoritados pelo usuário atual.",
        responses={200: ArticleSerializer(many=True)},
        tags=["articles"],
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def favorites(self, request):
        """Obter todos os artigos favoritados pelo usuário atual"""
        user = request.user
        articles = Article.objects.filter(favorites=user)
        page = self.paginate_queryset(articles)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)



@extend_schema_view(
    list=extend_schema(
        summary="Listar tags",
        description="Retorna uma lista paginada de tags com suporte a busca.",
        parameters=[
            OpenApiParameter(name="search", description="Buscar por nome da tag", type=str),
            OpenApiParameter(name="page", description="Número da página", type=int),
            OpenApiParameter(name="page_size", description="Tamanho da página", type=int),
        ],
        tags=["tags"],
    ),
    retrieve=extend_schema(
        summary="Obter tag",
        description="Retorna os detalhes de uma tag específica pelo slug.",
        tags=["tags"],
    ),
    create=extend_schema(
        summary="Criar tag",
        description="Cria uma nova tag. Requer autenticação.",
        tags=["tags"],
    ),
    update=extend_schema(
        summary="Atualizar tag",
        description="Atualiza uma tag existente. Requer autenticação.",
        tags=["tags"],
    ),
    partial_update=extend_schema(
        summary="Atualizar tag parcialmente",
        description="Atualiza parcialmente uma tag existente. Requer autenticação.",
        tags=["tags"],
    ),
    destroy=extend_schema(
        summary="Excluir tag",
        description="Exclui uma tag existente. Requer autenticação.",
        tags=["tags"],
    ),
)
class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all().order_by('name')  # Adicionar ordenação para evitar aviso de paginação
    serializer_class = TagSerializer
    lookup_field = 'slug'
    pagination_class = TagPagination
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_permissions(self):
        # Permitir leitura para todos, mas exigir autenticação para criar/editar/excluir
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class CommentPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar comentários de artigos
    """
    queryset = Comment.objects.all().select_related('article', 'parent')
    serializer_class = CommentSerializer
    pagination_class = CommentPagination
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['article', 'article_slug', 'is_approved', 'is_spam']
    search_fields = ['name', 'text']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Filtra comentários por artigo ou slug do artigo, se especificado na URL.
        Retorna apenas comentários de nível superior (sem parent).
        """
        queryset = super().get_queryset()

        # Filtrar por artigo_slug se fornecido
        article_slug = self.request.query_params.get('article_slug')
        if article_slug:
            queryset = queryset.filter(article_slug=article_slug)

        # Filtrar por artigo se fornecido
        article_id = self.request.query_params.get('article')
        if article_id:
            queryset = queryset.filter(article_id=article_id)

        # Retornar apenas comentários de nível superior (sem parent)
        # a menos que parent_id seja especificado
        parent_id = self.request.query_params.get('parent')
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        else:
            queryset = queryset.filter(parent__isnull=True)

        return queryset

    def get_serializer_context(self):
        """
        Adiciona o request ao contexto do serializer para acesso a informações como IP
        """
        context = super().get_serializer_context()
        return context

    def perform_create(self, serializer):
        """
        Salva o comentário, associando-o ao artigo correto se o slug for fornecido
        """
        article_slug = self.request.data.get('article_slug')
        if article_slug and not self.request.data.get('article'):
            try:
                article = Article.objects.get(slug=article_slug)
                serializer.save(article=article, article_slug=article_slug)
            except Article.DoesNotExist:
                serializer.save()
        else:
            serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        """
        Aprova um comentário
        """
        comment = self.get_object()
        comment.is_approved = True
        comment.is_spam = False
        comment.save()
        return Response({'status': 'comment approved'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        """
        Rejeita um comentário (marca como spam)
        """
        comment = self.get_object()
        comment.is_approved = False
        comment.is_spam = True
        comment.save()
        return Response({'status': 'comment rejected'})
