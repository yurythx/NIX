from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from apps.projects.teams.models import Team
import uuid

User = get_user_model()

class Board(models.Model):
    """Modelo para quadros de trabalho"""
    BOARD_TYPE_CHOICES = [
        ('kanban', 'Kanban'),
        ('list', 'Lista'),
        ('calendar', 'Calendário'),
        ('gantt', 'Gantt'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='boards')
    board_type = models.CharField(max_length=20, choices=BOARD_TYPE_CHOICES, default='kanban')
    is_public = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    icon = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=20, blank=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='created_boards'
    )
    members = models.ManyToManyField(
        User, 
        through='BoardMembership',
        related_name='boards'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'board'
        verbose_name_plural = 'boards'

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            
            # Adicionar team slug para garantir unicidade global
            team_slug = self.team.slug
            self.slug = f"{team_slug}-{base_slug}"
            
            # Garantir slug único
            original_slug = self.slug
            counter = 1
            while Board.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
                
        super().save(*args, **kwargs)


class BoardMembership(models.Model):
    """Modelo para associação entre usuários e quadros"""
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('editor', 'Editor'),
        ('viewer', 'Visualizador'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    board = models.ForeignKey(Board, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'board')
        ordering = ['joined_at']
        verbose_name = 'board membership'
        verbose_name_plural = 'board memberships'
    
    def __str__(self):
        return f"{self.user.username} - {self.board.name} ({self.role})"


class Column(models.Model):
    """Modelo para colunas de quadros"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='columns')
    position = models.PositiveIntegerField(default=0)
    color = models.CharField(max_length=20, blank=True)
    icon = models.CharField(max_length=50, blank=True)
    is_collapsed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['position']
        verbose_name = 'column'
        verbose_name_plural = 'columns'
        unique_together = ('board', 'position')
    
    def __str__(self):
        return f"{self.board.name} - {self.name}"
    
    def save(self, *args, **kwargs):
        # Se a posição não foi definida, colocar no final
        if self.position == 0:
            last_column = Column.objects.filter(board=self.board).order_by('-position').first()
            if last_column:
                self.position = last_column.position + 1
            else:
                self.position = 1
        
        super().save(*args, **kwargs)


class Label(models.Model):
    """Modelo para etiquetas"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=20, default='#3498db')
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='labels')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'label'
        verbose_name_plural = 'labels'
        unique_together = ('name', 'board')
    
    def __str__(self):
        return f"{self.board.name} - {self.name}"