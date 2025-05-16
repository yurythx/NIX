"""
Repositório base para acesso a dados
Implementa o padrão de repositório para encapsular a lógica de acesso a dados
"""

from typing import Any, Dict, List, Optional, Type, TypeVar, Union
from django.db.models import Model, QuerySet

# Tipo genérico para modelos
T = TypeVar('T', bound=Model)

class BaseRepository:
    """
    Repositório base para acesso a dados
    """
    model_class: Type[Model] = None

    def __init__(self, model_class: Type[T]):
        """
        Inicializa o repositório com a classe do modelo
        """
        self.model_class = model_class

    def get_all(self) -> QuerySet:
        """
        Obtém todos os registros
        """
        return self.model_class.objects.all()

    def get_by_id(self, id: Any) -> Optional[T]:
        """
        Obtém um registro pelo ID
        """
        try:
            # Verificar se o modelo usa UUID como chave primária
            from django.db.models import UUIDField
            import uuid

            # Verificar se o campo pk é um UUIDField
            pk_field = self.model_class._meta.pk
            if isinstance(pk_field, UUIDField) and isinstance(id, str):
                try:
                    # Tentar converter o ID para UUID
                    id = uuid.UUID(id)
                except ValueError:
                    # Se não for um UUID válido, retornar None
                    return None

            return self.model_class.objects.get(pk=id)
        except self.model_class.DoesNotExist:
            return None
        except Exception as e:
            # Log detalhado do erro para depuração
            import traceback
            print(f"Erro ao obter registro por ID: {str(e)}")
            print(traceback.format_exc())
            return None

    def get_by_slug(self, slug: str) -> Optional[T]:
        """
        Obtém um registro pelo slug
        """
        try:
            return self.model_class.objects.get(slug=slug)
        except self.model_class.DoesNotExist:
            return None

    def filter(self, **kwargs) -> QuerySet:
        """
        Filtra registros por critérios
        """
        return self.model_class.objects.filter(**kwargs)

    def create(self, **kwargs) -> T:
        """
        Cria um novo registro
        """
        return self.model_class.objects.create(**kwargs)

    def update(self, instance: T, **kwargs) -> T:
        """
        Atualiza um registro existente
        """
        for key, value in kwargs.items():
            setattr(instance, key, value)
        instance.save()
        return instance

    def delete(self, instance: T) -> bool:
        """
        Exclui um registro
        """
        instance.delete()
        return True

    def bulk_create(self, objects: List[T]) -> List[T]:
        """
        Cria múltiplos registros de uma vez
        """
        return self.model_class.objects.bulk_create(objects)

    def bulk_update(self, objects: List[T], fields: List[str]) -> None:
        """
        Atualiza múltiplos registros de uma vez
        """
        self.model_class.objects.bulk_update(objects, fields)
