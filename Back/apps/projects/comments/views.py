from django.shortcuts import render
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend

from .models import Comment
from .serializers import CommentSerializer
from utils.permissions import IsCommentAuthorOrTaskAssignee

class CommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gerenciamento de comentários.
    """
    queryset = Comment.objects.all().select_related('user', 'task')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsCommentAuthorOrTaskAssignee]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['task', 'user']
    search_fields = ['content']
    ordering_fields = ['created_at', 'updated_at']

    def get_queryset(self):
        """Filtra comentários por tarefa, se especificado na URL."""
        queryset = super().get_queryset()
        task_id = self.request.query_params.get('task')
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        return queryset

    def perform_create(self, serializer):
        """Atribui o usuário atual como autor do comentário."""
        serializer.save(user=self.request.user)
