from rest_framework import viewsets, permissions, status, filters
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from .models import Article, Comment, Tag
from .serializers import ArticleSerializer, CommentSerializer, TagSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .services import article_service, comment_service
from django.core.cache import cache

class ArticlePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class CommentPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class TagPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

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

    @action(detail=True, methods=['post'])
    def increment_views(self, request, slug=None):
        article = self.get_object()
        # Usar o serviço para incrementar visualizações
        article_service.view_article(article.id)
        return Response({
            'status': 'success',
            'views_count': article.views_count
        })

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

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def favorites(self, request):
        """Obter todos os artigos favoritados pelo usuário atual"""
        user = request.user
        articles = Article.objects.filter(favorites=user)
        page = self.paginate_queryset(articles)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

class CommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gerenciamento de comentários.
    Permite comentários anônimos (sem autenticação).
    """
    serializer_class = CommentSerializer
    pagination_class = CommentPagination
    permission_classes = [permissions.AllowAny]  # Permitir acesso anônimo
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['article', 'parent', 'is_approved', 'is_spam']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['created_at']  # Ordenação padrão: mais antigos primeiro

    def get_permissions(self):
        """
        Definir permissões com base na ação:
        - Qualquer um pode listar, recuperar e criar comentários
        - Apenas administradores podem atualizar, excluir ou aprovar/rejeitar comentários
        """
        if self.action in ['update', 'partial_update', 'destroy', 'approve', 'reject', 'mark_as_spam']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        """
        Filtrar comentários com base nos parâmetros da requisição.
        Por padrão, retorna apenas comentários aprovados e não marcados como spam.
        Administradores podem ver todos os comentários.
        """
        # Definir queryset base
        queryset = Comment.objects.all()

        # Filtrar por artigo
        article_id = self.request.query_params.get('article', None)
        article_slug = self.request.query_params.get('article_slug', None)

        if article_id:
            queryset = queryset.filter(article_id=article_id)
        elif article_slug:
            article = get_object_or_404(Article, slug=article_slug)
            queryset = queryset.filter(article=article)

        # Filtrar por comentários de nível superior (sem parent)
        top_level_only = self.request.query_params.get('top_level_only', 'false').lower() == 'true'
        if top_level_only:
            queryset = queryset.filter(parent__isnull=True)

        # Filtrar por status de aprovação e spam (apenas para não-administradores)
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_approved=True, is_spam=False)

        return queryset

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        """Aprovar um comentário."""
        comment = self.get_object()
        # Usar o serviço para aprovar o comentário
        comment_service.approve_comment(comment.id)
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        """Rejeitar um comentário."""
        comment = self.get_object()
        # Usar o serviço para rejeitar o comentário
        comment_service.reject_comment(comment.id)
        return Response({'status': 'rejected'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def mark_as_spam(self, request, pk=None):
        """Marcar um comentário como spam."""
        comment = self.get_object()
        # Primeiro rejeitar o comentário
        comment_service.reject_comment(comment.id)
        # Depois marcar como spam (atualização manual por enquanto)
        comment.is_spam = True
        comment.save(update_fields=['is_spam'])
        return Response({'status': 'marked as spam'})

    def perform_create(self, serializer):
        """Salvar o comentário com informações adicionais."""
        serializer.save()

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
