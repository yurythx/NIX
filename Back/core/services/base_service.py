"""
Serviço base para lógica de negócios
Implementa o padrão de serviço para encapsular a lógica de negócios
"""

from typing import Any, Dict, List, Optional, Type, TypeVar, Union
from django.db.models import Model, QuerySet
from core.repositories.base_repository import BaseRepository

# Tipo genérico para modelos
T = TypeVar('T', bound=Model)

class BaseService:
    """
    Serviço base para lógica de negócios
    """
    repository: BaseRepository = None

    def __init__(self, repository: BaseRepository):
        """
        Inicializa o serviço com o repositório
        """
        self.repository = repository

    def get_all(self) -> QuerySet:
        """
        Obtém todos os registros
        """
        return self.repository.get_all()

    def get_by_id(self, id: Any) -> Optional[T]:
        """
        Obtém um registro pelo ID
        """
        return self.repository.get_by_id(id)

    def get_by_slug(self, slug: str) -> Optional[T]:
        """
        Obtém um registro pelo slug
        """
        return self.repository.get_by_slug(slug)

    def filter(self, **kwargs) -> QuerySet:
        """
        Filtra registros por critérios
        """
        return self.repository.filter(**kwargs)

    def create(self, **kwargs) -> T:
        """
        Cria um novo registro
        """
        return self.repository.create(**kwargs)

    def update(self, instance: T, **kwargs) -> T:
        """
        Atualiza um registro existente
        """
        return self.repository.update(instance, **kwargs)

    def delete(self, instance: T) -> bool:
        """
        Exclui um registro
        """
        return self.repository.delete(instance)

    def bulk_create(self, objects: List[T]) -> List[T]:
        """
        Cria múltiplos registros de uma vez
        """
        return self.repository.bulk_create(objects)

    def bulk_update(self, objects: List[T], fields: List[str]) -> None:
        """
        Atualiza múltiplos registros de uma vez
        """
        self.repository.bulk_update(objects, fields)
