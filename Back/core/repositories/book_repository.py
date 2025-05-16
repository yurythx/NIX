"""
Repositório para livros
Implementa o padrão de repositório para encapsular a lógica de acesso a dados para o modelo Book
"""

from typing import Optional, List
from django.db.models import QuerySet
from django.db.models import Q
from apps.books.models import Book
from core.repositories.base_repository import BaseRepository

class BookRepository(BaseRepository):
    """
    Repositório para livros
    """
    def __init__(self):
        """
        Inicializa o repositório com o modelo Book
        """
        super().__init__(Book)

    def get_all_books(self) -> QuerySet:
        """
        Obtém todos os livros ordenados por título
        """
        return self.model_class.objects.all().order_by('title')

    def search_books(self, term: str) -> QuerySet:
        """
        Pesquisa livros por título ou descrição
        """
        return self.model_class.objects.filter(
            Q(title__icontains=term) | Q(description__icontains=term)
        ).order_by('title')

    def get_books_with_audio(self) -> QuerySet:
        """
        Obtém livros que possuem arquivo de áudio
        """
        return self.model_class.objects.exclude(audio_file='').exclude(audio_file__isnull=True)

    def get_books_without_audio(self) -> QuerySet:
        """
        Obtém livros que não possuem arquivo de áudio
        """
        return self.model_class.objects.filter(Q(audio_file='') | Q(audio_file__isnull=True))

    def get_book_by_title(self, title: str) -> Optional[Book]:
        """
        Obtém um livro pelo título exato
        """
        try:
            return self.model_class.objects.get(title__iexact=title)
        except self.model_class.DoesNotExist:
            return None

    def get_recent_books(self, limit: int = 10) -> QuerySet:
        """
        Obtém os livros mais recentes
        """
        return self.model_class.objects.all().order_by('-id')[:limit]

    def bulk_delete(self, ids: List[int]) -> int:
        """
        Exclui múltiplos livros pelos IDs
        """
        result = self.model_class.objects.filter(id__in=ids).delete()
        return result[0] if result and isinstance(result, tuple) else 0


# Instância única do repositório (Singleton)
book_repository = BookRepository()
