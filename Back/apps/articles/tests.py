"""
Testes para o app de artigos
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Article, Tag, Comment
from apps.categories.models import Category
import json

User = get_user_model()


class ArticleAPITestCase(TestCase):
    """
    Testes para a API de artigos
    """
    def setUp(self):
        """
        Configuração inicial para os testes
        """
        # Criar usuário para autenticação
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )

        # Criar categoria
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category',
            description='Test category description'
        )

        # Criar artigo
        self.article = Article.objects.create(
            title='Test Article',
            content='This is a test article content',
            category=self.category
        )

        # Adicionar aos favoritos do usuário
        self.article.favorites.add(self.user)

        # Criar tags
        self.tag1 = Tag.objects.create(name='Tag 1')
        self.tag2 = Tag.objects.create(name='Tag 2')

        # Adicionar tags ao artigo
        self.article.tags.add(self.tag1, self.tag2)

        # Criar cliente API
        self.client = APIClient()

    def test_list_articles(self):
        """
        Teste para listar artigos
        """
        url = reverse('article-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Test Article')

    def test_retrieve_article(self):
        """
        Teste para recuperar um artigo específico
        """
        url = reverse('article-detail', kwargs={'slug': self.article.slug})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Article')
        self.assertEqual(response.data['content'], 'This is a test article content')
        self.assertEqual(response.data['category']['name'], 'Test Category')
        self.assertEqual(len(response.data['tags']), 2)

    def test_create_article_unauthenticated(self):
        """
        Teste para criar um artigo sem autenticação (deve falhar)
        """
        url = reverse('article-list')
        data = {
            'title': 'New Article',
            'content': 'This is a new article content',
            'category_id': self.category.id,
            'tag_names': ['Tag 3', 'Tag 4']
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_article_authenticated(self):
        """
        Teste para criar um artigo com autenticação
        """
        self.client.force_authenticate(user=self.user)

        url = reverse('article-list')
        data = {
            'title': 'New Article',
            'content': 'This is a new article content',
            'category_id': self.category.id,
            'tag_names': ['Tag 3', 'Tag 4']
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Article')
        self.assertEqual(response.data['content'], 'This is a new article content')
        self.assertEqual(response.data['category']['name'], 'Test Category')

        # Verificar se as tags foram criadas
        article = Article.objects.get(slug=response.data['slug'])
        self.assertEqual(article.tags.count(), 2)
        self.assertTrue(article.tags.filter(name='Tag 3').exists())
        self.assertTrue(article.tags.filter(name='Tag 4').exists())

    def test_update_article(self):
        """
        Teste para atualizar um artigo
        """
        self.client.force_authenticate(user=self.user)

        url = reverse('article-detail', kwargs={'slug': self.article.slug})
        data = {
            'title': 'Updated Article',
            'content': 'This is an updated article content',
            'tag_names': ['Tag 5', 'Tag 6']
        }
        response = self.client.patch(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Article')
        self.assertEqual(response.data['content'], 'This is an updated article content')

        # Verificar se as tags foram atualizadas
        article = Article.objects.get(slug=response.data['slug'])
        self.assertEqual(article.tags.count(), 2)
        self.assertTrue(article.tags.filter(name='Tag 5').exists())
        self.assertTrue(article.tags.filter(name='Tag 6').exists())
        self.assertFalse(article.tags.filter(name='Tag 1').exists())

    def test_delete_article(self):
        """
        Teste para excluir um artigo
        """
        self.client.force_authenticate(user=self.user)

        url = reverse('article-detail', kwargs={'slug': self.article.slug})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Article.objects.count(), 0)

    def test_favorite_article(self):
        """
        Teste para favoritar um artigo
        """
        self.client.force_authenticate(user=self.user)

        # Primeiro remover dos favoritos para garantir que o teste funcione
        self.article.favorites.remove(self.user)

        url = reverse('article-favorite', kwargs={'slug': self.article.slug})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'added to favorites')
        self.assertTrue(response.data['is_favorite'])

        # Verificar se o artigo foi adicionado aos favoritos do usuário
        self.assertTrue(self.article.favorites.filter(id=self.user.id).exists())

    def test_increment_views(self):
        """
        Teste para incrementar visualizações de um artigo
        """
        url = reverse('article-increment-views', kwargs={'slug': self.article.slug})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')

        # Verificar se as visualizações foram incrementadas
        article = Article.objects.get(slug=self.article.slug)
        self.assertEqual(article.views_count, 1)
