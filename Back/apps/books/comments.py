"""
Modelo e serializador para comentários de livros
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Book

User = get_user_model()

class BookComment(models.Model):
    """
    Modelo para comentários em livros.
    Permite comentários aninhados (respostas).
    """
    book = models.ForeignKey(Book, related_name='comments', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='book_comments', on_delete=models.CASCADE)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='replies', on_delete=models.CASCADE)
    content = models.TextField(verbose_name='Conteúdo')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')

    # Campos para moderação
    is_approved = models.BooleanField(default=True, verbose_name='Aprovado')
    is_spam = models.BooleanField(default=False, verbose_name='Marcado como spam')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Comentário de Livro'
        verbose_name_plural = 'Comentários de Livros'

    def __str__(self):
        return f"Comentário de {self.user.username} em {self.book.title}"

    def save(self, *args, **kwargs):
        # Validação para garantir que o parent seja do mesmo livro
        if self.parent and self.parent.book_id != self.book_id:
            raise ValueError("O comentário pai deve pertencer ao mesmo livro")

        super().save(*args, **kwargs)

    @property
    def get_replies(self):
        """Retorna todas as respostas a este comentário."""
        return BookComment.objects.filter(parent=self, is_approved=True, is_spam=False)
