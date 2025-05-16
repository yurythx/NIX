"""
Repositório para artigos
Implementa o padrão de repositório para encapsular a lógica de acesso a dados de artigos
"""

from typing import List, Optional
from django.db.models import QuerySet, F, Count
from apps.articles.models import Article, Comment
from core.repositories.base_repository import BaseRepository

class ArticleRepository(BaseRepository):
    """
    Repositório para artigos
    """
    def __init__(self):
        """
        Inicializa o repositório com o modelo Article
        """
        super().__init__(Article)

    def get_featured(self) -> QuerySet:
        """
        Obtém artigos em destaque
        """
        return self.model_class.objects.filter(featured=True)

    def get_popular(self) -> QuerySet:
        """
        Obtém artigos populares
        """
        return self.model_class.objects.order_by('-views_count')

    def get_recent(self) -> QuerySet:
        """
        Obtém artigos recentes
        """
        return self.model_class.objects.order_by('-created_at')

    def get_by_category(self, category_slug: str) -> QuerySet:
        """
        Obtém artigos por categoria
        """
        return self.model_class.objects.filter(
            category__slug=category_slug
        )

    def get_by_author(self, author_id: str) -> QuerySet:
        """
        Obtém artigos por autor
        """
        return self.model_class.objects.filter(author_id=author_id)

    def increment_views(self, article_id: int) -> None:
        """
        Incrementa o contador de visualizações de um artigo
        """
        self.model_class.objects.filter(pk=article_id).update(views_count=F('views_count') + 1)

    def get_favorites_by_user(self, user_id: str) -> QuerySet:
        """
        Obtém artigos favoritados por um usuário
        """
        return self.model_class.objects.filter(favorites__id=user_id)

    def toggle_favorite(self, article_id: int, user_id: str) -> bool:
        """
        Favorita ou desfavorita um artigo
        Retorna True se o artigo foi favoritado, False se foi desfavoritado
        """
        article = self.get_by_id(article_id)
        if not article:
            return False

        if article.favorites.filter(id=user_id).exists():
            article.favorites.remove(user_id)
            return False
        else:
            article.favorites.add(user_id)
            return True

    def search(self, term: str) -> QuerySet:
        """
        Pesquisa artigos por termo
        """
        return self.model_class.objects.filter(
            title__icontains=term
        ) | self.model_class.objects.filter(
            content__icontains=term
        ) | self.model_class.objects.filter(
            category__name__icontains=term
        ).distinct()


class CommentRepository(BaseRepository):
    """
    Repositório para comentários
    """
    def __init__(self):
        """
        Inicializa o repositório com o modelo Comment
        """
        super().__init__(Comment)

    def get_by_article(self, article_id: int) -> QuerySet:
        """
        Obtém comentários de um artigo
        """
        return self.model_class.objects.filter(article_id=article_id, parent=None)

    def get_replies(self, comment_id: int) -> QuerySet:
        """
        Obtém respostas de um comentário
        """
        return self.model_class.objects.filter(parent_id=comment_id)

    def approve(self, comment_id: int) -> bool:
        """
        Aprova um comentário
        """
        comment = self.get_by_id(comment_id)
        if not comment:
            return False

        comment.is_approved = True
        comment.save()
        return True

    def reject(self, comment_id: int) -> bool:
        """
        Rejeita um comentário
        """
        comment = self.get_by_id(comment_id)
        if not comment:
            return False

        comment.is_approved = False
        comment.save()
        return True


# Instâncias únicas dos repositórios (Singleton)
article_repository = ArticleRepository()
comment_repository = CommentRepository()
