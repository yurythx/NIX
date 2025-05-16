"""
Views para comentários de livros
"""

from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404

from .comments import BookComment
from .models import Book
from .comment_serializers import BookCommentSerializer

class BookCommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gerenciamento de comentários de livros.
    """
    serializer_class = BookCommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['book', 'parent', 'is_approved', 'is_spam']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']  # Ordenação padrão: mais recentes primeiro

    def get_permissions(self):
        """
        Definir permissões com base na ação:
        - Qualquer um pode listar e recuperar comentários
        - Apenas usuários autenticados podem criar comentários
        - Apenas administradores podem atualizar, excluir ou aprovar/rejeitar comentários
        """
        if self.action in ['update', 'partial_update', 'destroy', 'approve', 'reject', 'mark_as_spam']:
            return [permissions.IsAdminUser()]
        elif self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        """
        Filtrar comentários com base nos parâmetros da requisição.
        Por padrão, retorna apenas comentários aprovados e não marcados como spam.
        Administradores podem ver todos os comentários.
        """
        # Definir queryset base
        queryset = BookComment.objects.all()

        # Filtrar por livro
        book_id = self.request.query_params.get('book', None)
        book_slug = self.request.query_params.get('book_slug', None)

        if book_id:
            queryset = queryset.filter(book_id=book_id)
        elif book_slug:
            book = get_object_or_404(Book, slug=book_slug)
            queryset = queryset.filter(book=book)

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
        comment.is_approved = True
        comment.is_spam = False
        comment.save()
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        """Rejeitar um comentário."""
        comment = self.get_object()
        comment.is_approved = False
        comment.save()
        return Response({'status': 'rejected'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def mark_as_spam(self, request, pk=None):
        """Marcar um comentário como spam."""
        comment = self.get_object()
        comment.is_approved = False
        comment.is_spam = True
        comment.save()
        return Response({'status': 'marked as spam'})
    
    def create(self, request, *args, **kwargs):
        """Criar um novo comentário."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        """Salvar o comentário."""
        serializer.save()
