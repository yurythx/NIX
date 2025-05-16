"""
Repositório para tags
Implementa o padrão de repositório para encapsular a lógica de acesso a dados de tags
"""

from typing import List, Optional
from django.db.models import QuerySet, Count
from apps.articles.models import Tag
from core.repositories.base_repository import BaseRepository

class TagRepository(BaseRepository):
    """
    Repositório para tags
    """
    def __init__(self):
        """
        Inicializa o repositório com o modelo Tag
        """
        super().__init__(Tag)

    def get_with_article_count(self) -> QuerySet:
        """
        Obtém tags com contagem de artigos
        """
        return self.model_class.objects.annotate(articles_count=Count('articles'))

    def get_popular_tags(self, limit: int = 10) -> QuerySet:
        """
        Obtém tags populares (com mais artigos)
        """
        return self.get_with_article_count().order_by('-articles_count')[:limit]

    def get_by_name(self, name: str) -> Optional[Tag]:
        """
        Obtém uma tag pelo nome
        """
        try:
            return self.model_class.objects.get(name__iexact=name)
        except self.model_class.DoesNotExist:
            return None

    def get_or_create(self, name: str) -> Tag:
        """
        Obtém ou cria uma tag
        """
        tag, created = self.model_class.objects.get_or_create(
            name__iexact=name,
            defaults={'name': name}
        )
        return tag

    def search_by_name(self, term: str) -> QuerySet:
        """
        Pesquisa tags por nome
        """
        return self.model_class.objects.filter(name__icontains=term)

    def get_related_tags(self, tag_id: int, limit: int = 5) -> QuerySet:
        """
        Obtém tags relacionadas (que aparecem nos mesmos artigos)
        """
        tag = self.get_by_id(tag_id)
        if not tag:
            return self.model_class.objects.none()

        # Obter artigos que usam esta tag
        article_ids = tag.articles.values_list('id', flat=True)

        # Obter tags usadas nesses artigos, excluindo a tag atual
        related_tags = self.model_class.objects.filter(
            articles__id__in=article_ids
        ).exclude(
            id=tag_id
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:limit]

        return related_tags


# Instância única do repositório (Singleton)
tag_repository = TagRepository()
