"""
Testes para o repositório de artigos
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.articles.models import Article, Comment, Tag
from core.repositories.article_repository import article_repository, comment_repository

User = get_user_model()

class ArticleRepositoryTestCase(TestCase):
    """
    Testes para o repositório de artigos
    """
    def setUp(self):
        """
        Configuração inicial para os testes
        """
        # Criar um usuário para os testes
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )

        # Criar alguns artigos para os testes
        self.article1 = Article.objects.create(
            title='Artigo 1',
            content='Conteúdo do artigo 1',
            featured=True
        )

        self.article2 = Article.objects.create(
            title='Artigo 2',
            content='Conteúdo do artigo 2',
            featured=False
        )

        self.article3 = Article.objects.create(
            title='Artigo 3',
            content='Conteúdo do artigo 3',
            featured=True
        )

        # Criar algumas tags para os testes
        self.tag1 = Tag.objects.create(name='Tag 1')
        self.tag2 = Tag.objects.create(name='Tag 2')

        # Adicionar tags aos artigos
        self.article1.tags.add(self.tag1)
        self.article2.tags.add(self.tag2)
        self.article3.tags.add(self.tag1, self.tag2)

    def test_get_all(self):
        """
        Testa o método get_all
        """
        articles = article_repository.get_all()
        self.assertEqual(articles.count(), 3)

    def test_get_by_id(self):
        """
        Testa o método get_by_id
        """
        article = article_repository.get_by_id(self.article1.id)
        self.assertEqual(article.title, 'Artigo 1')

        # Testar com ID inexistente
        article = article_repository.get_by_id(999)
        self.assertIsNone(article)

    def test_get_by_slug(self):
        """
        Testa o método get_by_slug
        """
        article = article_repository.get_by_slug(self.article1.slug)
        self.assertEqual(article.title, 'Artigo 1')

        # Testar com slug inexistente
        article = article_repository.get_by_slug('slug-inexistente')
        self.assertIsNone(article)

    def test_filter(self):
        """
        Testa o método filter
        """
        articles = article_repository.filter(featured=True)
        self.assertEqual(articles.count(), 2)
        self.assertIn(self.article1, articles)
        self.assertIn(self.article3, articles)

    def test_create(self):
        """
        Testa o método create
        """
        article = article_repository.create(
            title='Novo Artigo',
            content='Conteúdo do novo artigo',
            featured=False
        )
        self.assertEqual(article.title, 'Novo Artigo')
        self.assertEqual(article.content, 'Conteúdo do novo artigo')
        self.assertFalse(article.featured)

        # Verificar se o artigo foi realmente criado no banco de dados
        self.assertTrue(Article.objects.filter(title='Novo Artigo').exists())

    def test_update(self):
        """
        Testa o método update
        """
        article = article_repository.update(
            self.article1,
            title='Artigo 1 Atualizado',
            content='Conteúdo atualizado'
        )
        self.assertEqual(article.title, 'Artigo 1 Atualizado')
        self.assertEqual(article.content, 'Conteúdo atualizado')

        # Verificar se o artigo foi realmente atualizado no banco de dados
        article = Article.objects.get(id=self.article1.id)
        self.assertEqual(article.title, 'Artigo 1 Atualizado')
        self.assertEqual(article.content, 'Conteúdo atualizado')

    def test_delete(self):
        """
        Testa o método delete
        """
        result = article_repository.delete(self.article1)
        self.assertTrue(result)

        # Verificar se o artigo foi realmente excluído do banco de dados
        self.assertFalse(Article.objects.filter(id=self.article1.id).exists())

    def test_get_featured(self):
        """
        Testa o método get_featured
        """
        articles = article_repository.get_featured()
        self.assertEqual(articles.count(), 2)
        self.assertIn(self.article1, articles)
        self.assertIn(self.article3, articles)

    def test_increment_views(self):
        """
        Testa o método increment_views
        """
        # Verificar contagem inicial de visualizações
        self.assertEqual(self.article1.views_count, 0)

        # Incrementar visualizações
        article_repository.increment_views(self.article1.id)

        # Verificar se a contagem de visualizações foi incrementada
        article = Article.objects.get(id=self.article1.id)
        self.assertEqual(article.views_count, 1)

        # Incrementar novamente
        article_repository.increment_views(self.article1.id)

        # Verificar se a contagem de visualizações foi incrementada novamente
        article = Article.objects.get(id=self.article1.id)
        self.assertEqual(article.views_count, 2)

    def test_toggle_favorite(self):
        """
        Testa o método toggle_favorite
        """
        # Verificar que o artigo não está nos favoritos do usuário
        self.assertFalse(self.article1.favorites.filter(id=self.user.id).exists())

        # Favoritar o artigo
        result = article_repository.toggle_favorite(self.article1.id, self.user.id)
        self.assertTrue(result)

        # Verificar que o artigo está nos favoritos do usuário
        self.assertTrue(self.article1.favorites.filter(id=self.user.id).exists())

        # Desfavoritar o artigo
        result = article_repository.toggle_favorite(self.article1.id, self.user.id)
        self.assertFalse(result)

        # Verificar que o artigo não está mais nos favoritos do usuário
        self.assertFalse(self.article1.favorites.filter(id=self.user.id).exists())


class CommentRepositoryTestCase(TestCase):
    """
    Testes para o repositório de comentários
    """
    def setUp(self):
        """
        Configuração inicial para os testes
        """
        # Criar um artigo para os testes
        self.article = Article.objects.create(
            title='Artigo de Teste',
            content='Conteúdo do artigo de teste'
        )

        # Criar alguns comentários para os testes
        self.comment1 = Comment.objects.create(
            article=self.article,
            name='Usuário 1',
            text='Comentário 1',
            is_approved=True
        )

        self.comment2 = Comment.objects.create(
            article=self.article,
            name='Usuário 2',
            text='Comentário 2',
            is_approved=False
        )

        # Criar uma resposta ao comentário 1
        self.reply = Comment.objects.create(
            article=self.article,
            name='Usuário 3',
            text='Resposta ao comentário 1',
            parent=self.comment1,
            is_approved=True
        )

    def test_get_by_article(self):
        """
        Testa o método get_by_article
        """
        comments = comment_repository.get_by_article(self.article.id)
        self.assertEqual(comments.count(), 2)  # Apenas comentários de nível superior
        self.assertIn(self.comment1, comments)
        self.assertIn(self.comment2, comments)

    def test_get_replies(self):
        """
        Testa o método get_replies
        """
        replies = comment_repository.get_replies(self.comment1.id)
        self.assertEqual(replies.count(), 1)
        self.assertIn(self.reply, replies)

    def test_approve(self):
        """
        Testa o método approve
        """
        # Verificar estado inicial
        self.assertFalse(self.comment2.is_approved)

        # Aprovar o comentário
        result = comment_repository.approve(self.comment2.id)
        self.assertTrue(result)

        # Verificar se o comentário foi aprovado
        comment = Comment.objects.get(id=self.comment2.id)
        self.assertTrue(comment.is_approved)

    def test_reject(self):
        """
        Testa o método reject
        """
        # Verificar estado inicial
        self.assertTrue(self.comment1.is_approved)

        # Rejeitar o comentário
        result = comment_repository.reject(self.comment1.id)
        self.assertTrue(result)

        # Verificar se o comentário foi rejeitado
        comment = Comment.objects.get(id=self.comment1.id)
        self.assertFalse(comment.is_approved)
