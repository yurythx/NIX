"""
Serviço para categorias
Implementa o padrão de serviço para encapsular a lógica de negócios relacionada a categorias
"""

from typing import List, Optional, Dict, Any
from django.db.models import QuerySet
from apps.categories.models import Category
from core.repositories.category_repository import category_repository
from core.services.base_service import BaseService

class CategoryService(BaseService):
    """
    Serviço para categorias
    """
    def __init__(self):
        """
        Inicializa o serviço com o repositório de categorias
        """
        super().__init__(category_repository)

    def get_all_categories(self) -> QuerySet:
        """
        Obtém todas as categorias
        """
        return self.repository.get_all()

    def get_categories_with_article_count(self) -> QuerySet:
        """
        Obtém categorias com contagem de artigos
        """
        return self.repository.get_with_article_count()

    def get_popular_categories(self, limit: int = 5) -> QuerySet:
        """
        Obtém categorias populares (com mais artigos)
        """
        return self.repository.get_popular_categories(limit)

    def get_category_by_slug(self, slug: str) -> Optional[Category]:
        """
        Obtém uma categoria pelo slug
        """
        return self.repository.get_by_slug(slug)

    def get_category_by_name(self, name: str) -> Optional[Category]:
        """
        Obtém uma categoria pelo nome
        """
        return self.repository.get_by_name(name)

    def create_category(self, name: str, description: str = '') -> Category:
        """
        Cria uma nova categoria
        """
        # Verificar se já existe uma categoria com o mesmo nome
        existing_category = self.repository.get_by_name(name)
        if existing_category:
            raise ValueError(f"Já existe uma categoria com o nome '{name}'")

        # Criar a categoria
        return self.repository.create(name=name, description=description)

    def update_category(self, slug: str, data: Dict[str, Any]) -> Category:
        """
        Atualiza uma categoria
        """
        category = self.repository.get_by_slug(slug)
        if not category:
            raise ValueError(f"Categoria com slug '{slug}' não encontrada")

        # Verificar se o nome está sendo alterado e se já existe uma categoria com o novo nome
        if 'name' in data and data['name'].lower() != category.name.lower():
            existing_category = self.repository.get_by_name(data['name'])
            if existing_category:
                raise ValueError(f"Já existe uma categoria com o nome '{data['name']}'")

        # Atualizar a categoria
        return self.repository.update(category, **data)

    def delete_category(self, slug: str) -> bool:
        """
        Exclui uma categoria
        """
        category = self.repository.get_by_slug(slug)
        if not category:
            raise ValueError(f"Categoria com slug '{slug}' não encontrada")

        # Verificar se a categoria tem artigos associados
        if hasattr(category, 'articles') and category.articles.exists():
            raise ValueError("Não é possível excluir uma categoria que possui artigos associados")

        # Excluir a categoria
        return self.repository.delete(category)

    def search_categories(self, term: str) -> QuerySet:
        """
        Pesquisa categorias por nome
        """
        return self.repository.search_by_name(term)


# Instância única do serviço (Singleton)
category_service = CategoryService()
