"""
Serviço para tags
Implementa o padrão de serviço para encapsular a lógica de negócios relacionada a tags
"""

from typing import List, Optional, Dict, Any
from django.db.models import QuerySet
from apps.articles.models import Tag
from core.repositories.tag_repository import tag_repository
from core.services.base_service import BaseService

class TagService(BaseService):
    """
    Serviço para tags
    """
    def __init__(self):
        """
        Inicializa o serviço com o repositório de tags
        """
        super().__init__(tag_repository)

    def get_all_tags(self) -> QuerySet:
        """
        Obtém todas as tags
        """
        return self.repository.get_all()

    def get_tags_with_article_count(self) -> QuerySet:
        """
        Obtém tags com contagem de artigos
        """
        return self.repository.get_with_article_count()

    def get_popular_tags(self, limit: int = 10) -> QuerySet:
        """
        Obtém tags populares (com mais artigos)
        """
        return self.repository.get_popular_tags(limit)

    def get_tag_by_slug(self, slug: str) -> Optional[Tag]:
        """
        Obtém uma tag pelo slug
        """
        return self.repository.get_by_slug(slug)

    def get_tag_by_name(self, name: str) -> Optional[Tag]:
        """
        Obtém uma tag pelo nome
        """
        return self.repository.get_by_name(name)

    def create_tag(self, name: str) -> Tag:
        """
        Cria uma nova tag
        """
        # Verificar se já existe uma tag com o mesmo nome
        existing_tag = self.repository.get_by_name(name)
        if existing_tag:
            return existing_tag  # Retornar a tag existente em vez de criar uma nova

        # Criar a tag
        return self.repository.create(name=name)

    def update_tag(self, slug: str, data: Dict[str, Any]) -> Tag:
        """
        Atualiza uma tag
        """
        tag = self.repository.get_by_slug(slug)
        if not tag:
            raise ValueError(f"Tag com slug '{slug}' não encontrada")

        # Verificar se o nome está sendo alterado e se já existe uma tag com o novo nome
        if 'name' in data and data['name'].lower() != tag.name.lower():
            existing_tag = self.repository.get_by_name(data['name'])
            if existing_tag:
                raise ValueError(f"Já existe uma tag com o nome '{data['name']}'")

        # Atualizar a tag
        return self.repository.update(tag, **data)

    def delete_tag(self, slug: str) -> bool:
        """
        Exclui uma tag
        """
        tag = self.repository.get_by_slug(slug)
        if not tag:
            raise ValueError(f"Tag com slug '{slug}' não encontrada")

        # Excluir a tag
        return self.repository.delete(tag)

    def search_tags(self, term: str) -> QuerySet:
        """
        Pesquisa tags por nome
        """
        return self.repository.search_by_name(term)

    def get_related_tags(self, tag_slug: str, limit: int = 5) -> QuerySet:
        """
        Obtém tags relacionadas (que aparecem nos mesmos artigos)
        """
        tag = self.repository.get_by_slug(tag_slug)
        if not tag:
            raise ValueError(f"Tag com slug '{tag_slug}' não encontrada")

        return self.repository.get_related_tags(tag.id, limit)

    def process_tag_names(self, tag_names: List[str]) -> List[Tag]:
        """
        Processa uma lista de nomes de tags, criando-as se não existirem
        """
        tags = []
        for name in tag_names:
            name = name.strip()
            if name:
                tag = self.repository.get_or_create(name)
                tags.append(tag)
        return tags


# Instância única do serviço (Singleton)
tag_service = TagService()
