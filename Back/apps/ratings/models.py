from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg, Count

class Rating(models.Model):
    """
    Modelo para avaliações de conteúdo (livros, mangás, artigos, etc.)
    Usa GenericForeignKey para permitir avaliações em qualquer tipo de conteúdo
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ratings',
        verbose_name='Usuário'
    )

    # Campos para GenericForeignKey
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name='Tipo de conteúdo'
    )
    object_id = models.PositiveIntegerField(verbose_name='ID do objeto')
    content_object = GenericForeignKey('content_type', 'object_id')

    # Valor da avaliação (1-5 estrelas)
    value = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Avaliação'
    )

    # Comentário opcional
    comment = models.TextField(blank=True, null=True, verbose_name='Comentário')

    # Campos de auditoria
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')

    class Meta:
        verbose_name = 'Avaliação'
        verbose_name_plural = 'Avaliações'
        # Garantir que um usuário só possa avaliar um item uma vez
        unique_together = ('user', 'content_type', 'object_id')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.value} estrelas - {self.content_object}"

    @staticmethod
    def get_average_rating(content_type, object_id):
        """
        Retorna a média de avaliações para um objeto específico
        """
        return Rating.objects.filter(
            content_type=content_type,
            object_id=object_id
        ).aggregate(avg=Avg('value'))['avg'] or 0

    @staticmethod
    def get_rating_summary(content_type, object_id):
        """
        Retorna um resumo das avaliações para um objeto específico
        """
        ratings = Rating.objects.filter(
            content_type=content_type,
            object_id=object_id
        )

        # Calcular a média
        avg_rating = ratings.aggregate(avg=Avg('value'))['avg'] or 0

        # Contar o número de avaliações
        total_ratings = ratings.count()

        # Contar avaliações por valor (1-5 estrelas)
        rating_counts = {}
        for i in range(1, 6):
            rating_counts[i] = ratings.filter(value=i).count()

        return {
            'average': round(avg_rating, 1),
            'total': total_ratings,
            'counts': rating_counts
        }
