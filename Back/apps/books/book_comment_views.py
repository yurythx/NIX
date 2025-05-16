"""
Views para comentários de livros com tratamento de erros aprimorado
"""

from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist

from .comments import BookComment
from .models import Book
from .comment_serializers import BookCommentSerializer

class BookCommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gerenciamento de comentários de livros.
    
    list:
        Retorna uma lista de comentários de livros.
        
        Parâmetros de consulta:
        - book_slug: Slug do livro para filtrar comentários
        - book: ID do livro para filtrar comentários
        - parent: ID do comentário pai para filtrar respostas
        - top_level_only: Se "true", retorna apenas comentários de nível superior
        
    retrieve:
        Retorna um comentário específico.
        
    create:
        Cria um novo comentário.
        
        Dados necessários:
        - book_slug: Slug do livro
        - content: Conteúdo do comentário
        - parent_id: ID do comentário pai (opcional)
        
    update:
        Atualiza um comentário existente.
        
    partial_update:
        Atualiza parcialmente um comentário existente.
        
    delete:
        Exclui um comentário.
    """
    serializer_class = BookCommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['book', 'parent', 'is_approved', 'is_spam']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']  # Ordenação padrão: mais recentes primeiro

    def get_queryset(self):
        """
        Filtrar comentários com base nos parâmetros da requisição.
        Por padrão, retorna apenas comentários aprovados e não marcados como spam.
        Administradores podem ver todos os comentários.
        """
        try:
            # Definir queryset base
            queryset = BookComment.objects.all()

            # Filtrar por livro
            book_id = self.request.query_params.get('book', None)
            book_slug = self.request.query_params.get('book_slug', None)

            if book_id:
                queryset = queryset.filter(book_id=book_id)
            elif book_slug:
                try:
                    book = Book.objects.get(slug=book_slug)
                    queryset = queryset.filter(book=book)
                except Book.DoesNotExist:
                    raise NotFound(f"Livro com slug '{book_slug}' não encontrado.")

            # Filtrar por comentários de nível superior (sem parent)
            top_level_only = self.request.query_params.get('top_level_only', 'false').lower() == 'true'
            if top_level_only:
                queryset = queryset.filter(parent__isnull=True)

            # Filtrar por status de aprovação e spam (apenas para não-administradores)
            if not self.request.user.is_staff:
                queryset = queryset.filter(is_approved=True, is_spam=False)

            return queryset.select_related('user', 'book', 'parent')
        except Exception as e:
            # Log do erro para depuração
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erro ao obter comentários: {str(e)}")
            # Retornar queryset vazio em caso de erro
            return BookComment.objects.none()

    def create(self, request, *args, **kwargs):
        """
        Criar um novo comentário com tratamento de erros aprimorado.
        """
        try:
            with transaction.atomic():
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                self.perform_create(serializer)
                headers = self.get_success_headers(serializer.data)
                return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except ValidationError as e:
            return Response(
                {"detail": "Erro de validação", "errors": e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            # Log do erro para depuração
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erro ao criar comentário: {str(e)}")
            return Response(
                {"detail": "Erro ao criar comentário", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        """
        Atualizar um comentário existente com tratamento de erros aprimorado.
        """
        try:
            with transaction.atomic():
                partial = kwargs.pop('partial', False)
                instance = self.get_object()
                
                # Verificar se o usuário tem permissão para editar o comentário
                if not request.user.is_staff and instance.user != request.user:
                    raise PermissionDenied("Você não tem permissão para editar este comentário.")
                
                serializer = self.get_serializer(instance, data=request.data, partial=partial)
                serializer.is_valid(raise_exception=True)
                self.perform_update(serializer)
                return Response(serializer.data)
        except PermissionDenied as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except ValidationError as e:
            return Response(
                {"detail": "Erro de validação", "errors": e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            # Log do erro para depuração
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erro ao atualizar comentário: {str(e)}")
            return Response(
                {"detail": "Erro ao atualizar comentário", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        """
        Excluir um comentário com tratamento de erros aprimorado.
        """
        try:
            instance = self.get_object()
            
            # Verificar se o usuário tem permissão para excluir o comentário
            if not request.user.is_staff and instance.user != request.user:
                raise PermissionDenied("Você não tem permissão para excluir este comentário.")
            
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PermissionDenied as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            # Log do erro para depuração
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erro ao excluir comentário: {str(e)}")
            return Response(
                {"detail": "Erro ao excluir comentário", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        """Aprovar um comentário."""
        try:
            comment = self.get_object()
            comment.is_approved = True
            comment.is_spam = False
            comment.save()
            return Response({'status': 'approved'})
        except Exception as e:
            # Log do erro para depuração
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erro ao aprovar comentário: {str(e)}")
            return Response(
                {"detail": "Erro ao aprovar comentário", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        """Rejeitar um comentário."""
        try:
            comment = self.get_object()
            comment.is_approved = False
            comment.save()
            return Response({'status': 'rejected'})
        except Exception as e:
            # Log do erro para depuração
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erro ao rejeitar comentário: {str(e)}")
            return Response(
                {"detail": "Erro ao rejeitar comentário", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def mark_as_spam(self, request, pk=None):
        """Marcar um comentário como spam."""
        try:
            comment = self.get_object()
            comment.is_approved = False
            comment.is_spam = True
            comment.save()
            return Response({'status': 'marked as spam'})
        except Exception as e:
            # Log do erro para depuração
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erro ao marcar comentário como spam: {str(e)}")
            return Response(
                {"detail": "Erro ao marcar comentário como spam", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
