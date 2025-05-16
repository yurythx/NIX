"""
Modelos para o app de comentários universal
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

User = get_user_model()


class Comment(models.Model):
    """
    Modelo universal para comentários em qualquer tipo de conteúdo.
    Usa o sistema de ContentType do Django para relacionar com qualquer modelo.
    Permite comentários aninhados (respostas).
    """
    # Campos para o relacionamento genérico (pode se relacionar com qualquer modelo)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE,
                                    verbose_name='Tipo de conteúdo')
    object_id = models.PositiveIntegerField(verbose_name='ID do objeto')
    content_object = GenericForeignKey('content_type', 'object_id')

    # Campos do comentário
    user = models.ForeignKey(User, related_name='comments', on_delete=models.CASCADE,
                           verbose_name='Usuário')
    parent = models.ForeignKey('self', null=True, blank=True, related_name='replies',
                             on_delete=models.CASCADE, verbose_name='Comentário pai')
    content = models.TextField(verbose_name='Conteúdo')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')

    # Campos para usuários anônimos (opcional)
    name = models.CharField(max_length=100, blank=True, null=True, verbose_name='Nome')
    email = models.EmailField(blank=True, null=True, verbose_name='Email')

    # Campos para moderação
    is_approved = models.BooleanField(default=True, verbose_name='Aprovado')
    is_spam = models.BooleanField(default=False, verbose_name='Marcado como spam')

    # Campos para rastreamento
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='Endereço IP')
    user_agent = models.TextField(null=True, blank=True, verbose_name='User Agent')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Comentário'
        verbose_name_plural = 'Comentários'
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
        ]

    def __str__(self):
        return f"Comentário de {self.user_name} em {self.content_type.model} #{self.object_id}"

    @property
    def user_name(self):
        """Retorna o nome do usuário ou o nome anônimo"""
        if self.user:
            return self.user.username
        return self.name or 'Anônimo'

    def save(self, *args, **kwargs):
        # Validação para garantir que o parent seja do mesmo objeto
        if self.parent and (
            self.parent.content_type_id != self.content_type_id or
            self.parent.object_id != self.object_id
        ):
            raise ValueError("O comentário pai deve pertencer ao mesmo objeto")

        super().save(*args, **kwargs)

    @property
    def get_replies(self):
        """Retorna todas as respostas a este comentário."""
        return Comment.objects.filter(
            parent=self,
            is_approved=True,
            is_spam=False
        )
