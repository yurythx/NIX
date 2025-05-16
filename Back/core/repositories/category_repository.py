"""
Repositório para categorias
Implementa o padrão de repositório para encapsular a lógica de acesso a dados de categorias
"""

from typing import List, Optional
from django.db.models import QuerySet, Count
from apps.categories.models import Category
from core.repositories.base_repository import BaseRepository

class CategoryRepository(BaseRepository):
    """
    Repositório para categorias
    """
    def __init__(self):
        """
        Inicializa o repositório com o modelo Category
        """
        super().__init__(Category)

    def get_with_article_count(self) -> QuerySet:
        """
        Obtém categorias com contagem de artigos
        """
        return self.model_class.objects.annotate(articles_count=Count('articles'))

    def get_popular_categories(self, limit: int = 5) -> QuerySet:
        """
        Obtém categorias populares (com mais artigos)
        """
        return self.get_with_article_count().order_by('-articles_count')[:limit]

    def get_by_name(self, name: str) -> Optional[Category]:
        """
        Obtém uma categoria pelo nome
        """
        try:
            return self.model_class.objects.get(name__iexact=name)
        except self.model_class.DoesNotExist:
            return None

    def get_or_create(self, name: str, description: str = '') -> Category:
        """
        Obtém ou cria uma categoria
        """
        category, created = self.model_class.objects.get_or_create(
            name__iexact=name,
            defaults={
                'name': name,
                'description': description
            }
        )
        return category

    def search_by_name(self, term: str) -> QuerySet:
        """
        Pesquisa categorias por nome
        """
        return self.model_class.objects.filter(name__icontains=term)


# Instância única do repositório (Singleton)
category_repository = CategoryRepository()
