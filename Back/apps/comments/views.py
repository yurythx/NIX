"""
Views para o app de comentários universal
"""

from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.contrib.contenttypes.models import ContentType

from .models import Comment
from .serializers import CommentSerializer


class CommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gerenciamento de comentários universais.

    list:
        Retorna uma lista de comentários.

        Parâmetros de consulta:
        - content_type: Tipo de conteúdo no formato "app_label.model"
        - object_id: ID do objeto
        - parent: ID do comentário pai para filtrar respostas
        - top_level_only: Se "true", retorna apenas comentários de nível superior

    retrieve:
        Retorna um comentário específico.

    create:
        Cria um novo comentário.

        Dados necessários:
        - content_type_str: Tipo de conteúdo no formato "app_label.model"
        - object_id: ID do objeto
        - content: Conteúdo do comentário
        - parent_id: ID do comentário pai (opcional)
        - name: Nome do usuário (opcional, para comentários anônimos)
        - email: Email do usuário (opcional, para comentários anônimos)

    update:
        Atualiza um comentário existente.

    partial_update:
        Atualiza parcialmente um comentário existente.

    delete:
        Exclui um comentário.
    """
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['parent', 'is_approved', 'is_spam']
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
            queryset = Comment.objects.all()

            # Filtrar por tipo de conteúdo e objeto
            content_type_str = self.request.query_params.get('content_type_str')
            if not content_type_str:
                content_type_str = self.request.query_params.get('content_type')
            object_id = self.request.query_params.get('object_id')

            # Remover aspas simples ou duplas do object_id se presentes
            if object_id and (object_id.startswith("'") and object_id.endswith("'")) or (object_id.startswith('"') and object_id.endswith('"')):
                object_id = object_id[1:-1]

            # Log para depuração
            import logging
            logger = logging.getLogger(__name__)
            print(f"DEBUG: Parâmetros de consulta: content_type={content_type_str}, object_id={object_id}")

            # Imprimir todos os comentários para depuração
            all_comments = Comment.objects.all()
            print(f"DEBUG: Total de comentários no banco: {all_comments.count()}")
            for c in all_comments:
                print(f"DEBUG: Comentário ID={c.id}, content_type_id={c.content_type_id}, object_id={c.object_id}, content={c.content[:30]}")

            if content_type_str and object_id:
                try:
                    app_label, model = content_type_str.split('.')
                    content_type = ContentType.objects.get(app_label=app_label, model=model)
                    print(f"DEBUG: ContentType encontrado: {content_type.app_label}.{content_type.model} (ID: {content_type.id})")

                    # Verificar se existem comentários para este content_type e object_id
                    comments_for_object = Comment.objects.filter(content_type=content_type, object_id=object_id)
                    print(f"DEBUG: Número de comentários encontrados: {comments_for_object.count()}")
                    for c in comments_for_object:
                        print(f"DEBUG: Comentário encontrado: ID={c.id}, content={c.content[:30]}, is_approved={c.is_approved}, is_spam={c.is_spam}")

                    queryset = queryset.filter(content_type=content_type, object_id=object_id)
                except (ValueError, ContentType.DoesNotExist):
                    logger.error(f"Tipo de conteúdo '{content_type_str}' não encontrado.")
                    raise NotFound(f"Tipo de conteúdo '{content_type_str}' não encontrado.")

            # Filtrar por comentários de nível superior (sem parent)
            top_level_only = self.request.query_params.get('top_level_only', 'false').lower() == 'true'
            if top_level_only:
                queryset = queryset.filter(parent__isnull=True)

            # Filtrar por status de aprovação e spam (apenas para não-administradores)
            if not self.request.user.is_staff:
                queryset = queryset.filter(is_approved=True, is_spam=False)

            # Imprimir diretamente no console para depuração
            final_queryset = queryset.select_related('user', 'parent')

            # Forçar a saída para o console
            import sys
            sys.stdout.write(f"FINAL QUERYSET: {final_queryset.query}\n")
            sys.stdout.write(f"NÚMERO DE COMENTÁRIOS: {final_queryset.count()}\n")
            sys.stdout.flush()

            # Listar todos os comentários para depuração
            for comment in final_queryset:
                sys.stdout.write(f"COMENTÁRIO: ID={comment.id}, content_type={comment.content_type}, object_id={comment.object_id}\n")
                sys.stdout.flush()

            return final_queryset
        except Exception as e:
            # Log do erro para depuração
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erro ao obter comentários: {str(e)}")
            # Retornar queryset vazio em caso de erro
            return Comment.objects.none()

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
