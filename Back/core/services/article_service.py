"""
Serviço para artigos
Implementa o padrão de serviço para encapsular a lógica de negócios relacionada a artigos
"""

from typing import List, Optional, Dict, Any
from django.db.models import QuerySet
from django.contrib.auth import get_user_model
from apps.articles.models import Article, Comment
from core.repositories.article_repository import article_repository, comment_repository
from core.services.base_service import BaseService

User = get_user_model()

class ArticleService(BaseService):
    """
    Serviço para artigos
    """
    def __init__(self):
        """
        Inicializa o serviço com o repositório de artigos
        """
        super().__init__(article_repository)

    def get_featured_articles(self) -> QuerySet:
        """
        Obtém artigos em destaque
        """
        return self.repository.get_featured()

    def get_popular_articles(self) -> QuerySet:
        """
        Obtém artigos populares
        """
        return self.repository.get_popular()

    def get_recent_articles(self) -> QuerySet:
        """
        Obtém artigos recentes
        """
        return self.repository.get_recent()

    def get_articles_by_category(self, category_slug: str) -> QuerySet:
        """
        Obtém artigos por categoria
        """
        return self.repository.get_by_category(category_slug)

    def get_articles_by_author(self, author_id: str) -> QuerySet:
        """
        Obtém artigos por autor
        """
        return self.repository.get_by_author(author_id)

    def view_article(self, article_id: int) -> None:
        """
        Registra uma visualização de artigo
        """
        self.repository.increment_views(article_id)

    def get_favorite_articles(self, user_id: str) -> QuerySet:
        """
        Obtém artigos favoritados por um usuário
        """
        return self.repository.get_favorites_by_user(user_id)

    def toggle_favorite_article(self, article_id: int, user_id: str) -> bool:
        """
        Favorita ou desfavorita um artigo
        Retorna True se o artigo foi favoritado, False se foi desfavoritado
        """
        return self.repository.toggle_favorite(article_id, user_id)

    def search_articles(self, term: str) -> QuerySet:
        """
        Pesquisa artigos por termo
        """
        return self.repository.search(term)

    def create_article(self, data: Dict[str, Any], author_id: str) -> Article:
        """
        Cria um novo artigo
        """
        # Obter o autor
        author = User.objects.get(pk=author_id)
        
        # Criar o artigo
        article = self.repository.create(
            title=data['title'],
            content=data['content'],
            author=author,
            featured=data.get('featured', False)
        )
        
        # Adicionar categoria
        if 'category_id' in data:
            article.category_id = data['category_id']
            article.save()
        
        # Adicionar tags
        if 'tag_names' in data and isinstance(data['tag_names'], list):
            from apps.articles.models import Tag
            for tag_name in data['tag_names']:
                tag, _ = Tag.objects.get_or_create(name=tag_name)
                article.tags.add(tag)
        
        return article


class CommentService(BaseService):
    """
    Serviço para comentários
    """
    def __init__(self):
        """
        Inicializa o serviço com o repositório de comentários
        """
        super().__init__(comment_repository)

    def get_article_comments(self, article_id: int) -> QuerySet:
        """
        Obtém comentários de um artigo
        """
        return self.repository.get_by_article(article_id)

    def get_comment_replies(self, comment_id: int) -> QuerySet:
        """
        Obtém respostas de um comentário
        """
        return self.repository.get_replies(comment_id)

    def create_comment(self, data: Dict[str, Any], article_id: int, user_id: Optional[str] = None) -> Comment:
        """
        Cria um novo comentário
        """
        # Preparar dados do comentário
        comment_data = {
            'article_id': article_id,
            'text': data['text'],
            'name': data.get('name', 'Anônimo'),
            'is_approved': True  # Por padrão, comentários são aprovados automaticamente
        }
        
        # Adicionar email se fornecido
        if 'email' in data:
            comment_data['email'] = data['email']
        
        # Adicionar comentário pai se for uma resposta
        if 'parent_id' in data:
            comment_data['parent_id'] = data['parent_id']
        
        # Criar o comentário
        return self.repository.create(**comment_data)

    def approve_comment(self, comment_id: int) -> bool:
        """
        Aprova um comentário
        """
        return self.repository.approve(comment_id)

    def reject_comment(self, comment_id: int) -> bool:
        """
        Rejeita um comentário
        """
        return self.repository.reject(comment_id)


# Instâncias únicas dos serviços (Singleton)
article_service = ArticleService()
comment_service = CommentService()
