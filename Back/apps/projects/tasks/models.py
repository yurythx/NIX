from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.utils import timezone
from django.core.validators import MaxValueValidator
from apps.projects.boards.models import Board, Column
import uuid

User = get_user_model()

class Label(models.Model):
    """Modelo para etiquetas que podem ser aplicadas a tarefas"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=20, default='#0066FF')
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='task_labels')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
        unique_together = ('name', 'board')
        verbose_name = 'task label'
        verbose_name_plural = 'task labels'
    
    def __str__(self):
        return f"{self.name} ({self.board.name})"


class Task(models.Model):
    """Modelo para tarefas"""
    PRIORITY_CHOICES = [
        ('low', 'Baixa'),
        ('medium', 'Média'),
        ('high', 'Alta'),
        ('urgent', 'Urgente'),
    ]
    
    STATUS_CHOICES = [
        ('todo', 'A fazer'),
        ('in_progress', 'Em progresso'),
        ('done', 'Concluído'),
        ('blocked', 'Bloqueado'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='tasks')
    column = models.ForeignKey(
        Column, 
        on_delete=models.SET_NULL, 
        related_name='tasks', 
        null=True, 
        blank=True
    )
    order = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='created_tasks'
    )
    assignees = models.ManyToManyField(
        User, 
        related_name='assigned_tasks',
        blank=True
    )
    labels = models.ManyToManyField(
        Label, 
        related_name='tasks',
        blank=True
    )
    parent_task = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        related_name='subtasks',
        null=True, 
        blank=True
    )
    due_date = models.DateTimeField(null=True, blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    estimated_time = models.PositiveIntegerField(null=True, blank=True, help_text="Tempo estimado em minutos")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    is_archived = models.BooleanField(default=False)
    completion_percentage = models.PositiveIntegerField(default=0, validators=[
        MaxValueValidator(100)
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = 'task'
        verbose_name_plural = 'tasks'
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            # Adicionar um timestamp para garantir unicidade
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            self.slug = f"{base_slug}-{timestamp}"
            
        # Atualizar completed_at se a tarefa estiver concluída
        if self.status == 'done' and not self.completed_at:
            self.completed_at = timezone.now()
        elif self.status != 'done':
            self.completed_at = None
            
        super().save(*args, **kwargs)


class Comment(models.Model):
    """Modelo para comentários em tarefas"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_comments')
    content = models.TextField()
    mentioned_users = models.ManyToManyField(
        User, 
        related_name='mentions',
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_edited = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'comment'
        verbose_name_plural = 'comments'
    
    def __str__(self):
        return f"Comentário de {self.user.username} em {self.task.title}"
    
    def save(self, *args, **kwargs):
        # Se for uma atualização, marcar como editado
        if self.pk:
            self.is_edited = True
        super().save(*args, **kwargs)


class Attachment(models.Model):
    """Modelo para anexos em tarefas"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_attachments')
    file = models.FileField(upload_to='attachments/')
    name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50, blank=True)
    size = models.PositiveIntegerField(help_text="Tamanho em bytes")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'attachment'
        verbose_name_plural = 'attachments'
    
    def __str__(self):
        return f"{self.name} ({self.task.title})"


class TaskHistory(models.Model):
    """Modelo para histórico de alterações em tarefas"""
    ACTION_CHOICES = [
        ('create', 'Criação'),
        ('update', 'Atualização'),
        ('delete', 'Exclusão'),
        ('assign', 'Atribuição'),
        ('unassign', 'Desatribuição'),
        ('move', 'Movimentação'),
        ('comment', 'Comentário'),
        ('attachment', 'Anexo'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='history')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_history')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'task history'
        verbose_name_plural = 'task histories'
    
    def __str__(self):
        return f"{self.action} em {self.task.title} por {self.user.username}"