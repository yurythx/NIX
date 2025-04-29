from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class Comment(models.Model):
    """
    Modelo para comentários em tarefas.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(
        'tasks.Task', 
        on_delete=models.CASCADE, 
        related_name='project_comments'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='project_task_comments'
    )
    content = models.TextField()
    mentioned_users = models.ManyToManyField(
        User, 
        related_name='project_mentions',
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_edited = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'project comment'
        verbose_name_plural = 'project comments'
    
    def __str__(self):
        return f"Comentário de {self.user.username} em {self.task.title}"
    
    def save(self, *args, **kwargs):
        """Marca o comentário como editado se for uma atualização."""
        if self.pk:
            self.is_edited = True
        super().save(*args, **kwargs)
