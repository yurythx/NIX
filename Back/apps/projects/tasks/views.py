from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from apps.projects.tasks.models import Task, Label, Comment, Attachment, TaskHistory

from .serializers import (
    TaskListSerializer,
    TaskDetailSerializer,
    TaskCreateUpdateSerializer,
    LabelSerializer,
    CommentSerializer,
    AttachmentSerializer,
    TaskHistorySerializer
)
from utils.permissions import IsOwnerOrReadOnly, IsBoardMember
from utils.mixins import SlugBasedViewSetMixin, HistoryMixin, StatusToggleMixin, DuplicateMixin


class TaskViewSet(SlugBasedViewSetMixin, StatusToggleMixin, DuplicateMixin, viewsets.ModelViewSet):
    """
    API endpoint para gerenciamento de tarefas.
    """
    serializer_class = TaskListSerializer
    permission_classes = [IsBoardMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['board', 'column', 'status', 'priority', 'assignees', 'is_archived', 'created_by']
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'created_at', 'due_date']

    def get_serializer_class(self):
        """Retorna o serializer apropriado com base na ação."""
        if self.action == 'retrieve':
            return TaskDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TaskCreateUpdateSerializer
        return TaskListSerializer

    def get_queryset(self):
        """Filtra as tarefas com base no usuário e parâmetros opcionais."""
        if not self.request.user.is_authenticated:
            return Task.objects.none()
            
        return Task.objects.filter(
            board__owner=self.request.user
        ) | Task.objects.filter(
            board__memberships__user=self.request.user
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def archive(self, request, slug=None):
        """Arquiva ou desarquiva uma tarefa."""
        task = self.get_object()
        task.is_archived = not task.is_archived
        task.save()
        return Response({'status': 'archived' if task.is_archived else 'unarchived'})

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def comments(self, request, slug=None):
        """Retorna todos os comentários relacionados à tarefa."""
        task = self.get_object()
        comments = Comment.objects.filter(task=task).select_related('user')
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def history(self, request, slug=None):
        """Retorna o histórico de alterações da tarefa."""
        task = self.get_object()
        history = TaskHistory.objects.filter(task=task).order_by('-created_at')
        serializer = TaskHistorySerializer(history, many=True)
        return Response(serializer.data)


class LabelViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gerenciamento de etiquetas de tarefas.
    """
    queryset = Label.objects.all()
    serializer_class = LabelSerializer
    permission_classes = [permissions.IsAuthenticated, IsBoardMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['board']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        """Filtra etiquetas por quadro, se especificado na URL."""
        queryset = super().get_queryset()
        board_id = self.request.query_params.get('board')
        if board_id:
            queryset = queryset.filter(board_id=board_id)
        return queryset


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsBoardMember]
    
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Comment.objects.none()
            
        return Comment.objects.filter(
            task__board__owner=self.request.user
        ) | Comment.objects.filter(
            task__board__memberships__user=self.request.user
        ).distinct()
        
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = AttachmentSerializer
    permission_classes = [IsBoardMember]
    
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Attachment.objects.none()
            
        return Attachment.objects.filter(
            task__board__owner=self.request.user
        ) | Attachment.objects.filter(
            task__board__memberships__user=self.request.user
        ).distinct()
        
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)