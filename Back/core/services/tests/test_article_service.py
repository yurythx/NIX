"""
Testes para o serviço de artigos
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.articles.models import Article, Comment, Tag
from core.services.article_service import article_service, comment_service
from unittest.mock import patch, MagicMock

User = get_user_model()

class ArticleServiceTestCase(TestCase):
    """
    Testes para o serviço de artigos
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
            featured=True,
            author=self.user
        )

        self.article2 = Article.objects.create(
            title='Artigo 2',
            content='Conteúdo do artigo 2',
            featured=False,
            author=self.user
        )

        # Criar algumas tags para os testes
        self.tag1 = Tag.objects.create(name='Tag 1')
        self.tag2 = Tag.objects.create(name='Tag 2')

        # Adicionar tags aos artigos
        self.article1.tags.add(self.tag1)
        self.article2.tags.add(self.tag2)

    def test_get_featured_articles(self):
        """
        Testa o método get_featured_articles
        """
        articles = article_service.get_featured_articles()
        self.assertEqual(articles.count(), 1)
        self.assertIn(self.article1, articles)

    def test_get_popular_articles(self):
        """
        Testa o método get_popular_articles
        """
        # Incrementar visualizações do artigo 2
        self.article2.views_count = 10
        self.article2.save()

        articles = article_service.get_popular_articles()
        self.assertEqual(articles.count(), 2)
        self.assertEqual(articles[0], self.article2)  # Artigo 2 deve ser o primeiro (mais popular)

    def test_get_recent_articles(self):
        """
        Testa o método get_recent_articles
        """
        articles = article_service.get_recent_articles()
        self.assertEqual(articles.count(), 2)
        self.assertEqual(articles[0], self.article2)  # Artigo 2 deve ser o primeiro (mais recente)

    def test_view_article(self):
        """
        Testa o método view_article
        """
        # Verificar contagem inicial de visualizações
        self.assertEqual(self.article1.views_count, 0)

        # Visualizar o artigo
        article_service.view_article(self.article1.id)

        # Verificar se a contagem de visualizações foi incrementada
        article = Article.objects.get(id=self.article1.id)
        self.assertEqual(article.views_count, 1)

    def test_toggle_favorite_article(self):
        """
        Testa o método toggle_favorite_article
        """
        # Verificar que o artigo não está nos favoritos do usuário
        self.assertFalse(self.article1.favorites.filter(id=self.user.id).exists())

        # Favoritar o artigo
        result = article_service.toggle_favorite_article(self.article1.id, self.user.id)
        self.assertTrue(result)

        # Verificar que o artigo está nos favoritos do usuário
        self.assertTrue(self.article1.favorites.filter(id=self.user.id).exists())

        # Desfavoritar o artigo
        result = article_service.toggle_favorite_article(self.article1.id, self.user.id)
        self.assertFalse(result)

        # Verificar que o artigo não está mais nos favoritos do usuário
        self.assertFalse(self.article1.favorites.filter(id=self.user.id).exists())

    def test_search_articles(self):
        """
        Testa o método search_articles
        """
        # Pesquisar por título
        articles = article_service.search_articles('Artigo 1')
        self.assertEqual(articles.count(), 1)
        self.assertIn(self.article1, articles)

        # Pesquisar por conteúdo
        articles = article_service.search_articles('Conteúdo do artigo 2')
        self.assertEqual(articles.count(), 1)
        self.assertIn(self.article2, articles)

    @patch('core.repositories.article_repository.article_repository.create')
    def test_create_article(self, mock_create):
        """
        Testa o método create_article
        """
        # Configurar o mock
        mock_article = MagicMock()
        mock_create.return_value = mock_article

        # Criar um artigo
        data = {
            'title': 'Novo Artigo',
            'content': 'Conteúdo do novo artigo',
            'featured': True,
            'category_id': 1,
            'tag_names': ['Tag 1', 'Tag 2']
        }

        article = article_service.create_article(data, self.user.id)

        # Verificar se o método create do repositório foi chamado com os parâmetros corretos
        mock_create.assert_called_once()
        call_args = mock_create.call_args[1]
        self.assertEqual(call_args['title'], 'Novo Artigo')
        self.assertEqual(call_args['content'], 'Conteúdo do novo artigo')
        self.assertEqual(call_args['featured'], True)
        self.assertEqual(call_args['author'], self.user)


class CommentServiceTestCase(TestCase):
    """
    Testes para o serviço de comentários
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

    def test_get_article_comments(self):
        """
        Testa o método get_article_comments
        """
        comments = comment_service.get_article_comments(self.article.id)
        self.assertEqual(comments.count(), 2)  # Apenas comentários de nível superior
        self.assertIn(self.comment1, comments)
        self.assertIn(self.comment2, comments)

    def test_get_comment_replies(self):
        """
        Testa o método get_comment_replies
        """
        replies = comment_service.get_comment_replies(self.comment1.id)
        self.assertEqual(replies.count(), 1)
        self.assertIn(self.reply, replies)

    @patch('core.repositories.article_repository.comment_repository.create')
    def test_create_comment(self, mock_create):
        """
        Testa o método create_comment
        """
        # Configurar o mock
        mock_comment = MagicMock()
        mock_create.return_value = mock_comment

        # Criar um comentário
        data = {
            'text': 'Novo comentário',
            'name': 'Usuário Teste',
            'email': 'usuario@teste.com'
        }

        comment = comment_service.create_comment(data, self.article.id)

        # Verificar se o método create do repositório foi chamado com os parâmetros corretos
        mock_create.assert_called_once()
        call_args = mock_create.call_args[1]
        self.assertEqual(call_args['article_id'], self.article.id)
        self.assertEqual(call_args['text'], 'Novo comentário')
        self.assertEqual(call_args['name'], 'Usuário Teste')
        self.assertEqual(call_args['email'], 'usuario@teste.com')
        self.assertEqual(call_args['is_approved'], True)

    def test_approve_comment(self):
        """
        Testa o método approve_comment
        """
        # Verificar estado inicial
        self.assertFalse(self.comment2.is_approved)

        # Aprovar o comentário
        result = comment_service.approve_comment(self.comment2.id)
        self.assertTrue(result)

        # Verificar se o comentário foi aprovado
        comment = Comment.objects.get(id=self.comment2.id)
        self.assertTrue(comment.is_approved)

    def test_reject_comment(self):
        """
        Testa o método reject_comment
        """
        # Verificar estado inicial
        self.assertTrue(self.comment1.is_approved)

        # Rejeitar o comentário
        result = comment_service.reject_comment(self.comment1.id)
        self.assertTrue(result)

        # Verificar se o comentário foi rejeitado
        comment = Comment.objects.get(id=self.comment1.id)
        self.assertFalse(comment.is_approved)
