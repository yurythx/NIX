"""
Testes para o app de livros
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Book
from apps.categories.models import Category
import tempfile
from PIL import Image
import os

User = get_user_model()


class BookAPITestCase(TestCase):
    """
    Testes para a API de livros
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

        # Criar livro
        self.book = Book.objects.create(
            title='Test Book',
            description='This is a test book description',
            category=self.category
        )

        # Criar cliente API
        self.client = APIClient()

        # Definir URLs
        self.list_url = '/api/v1/books/books/'
        self.detail_url = f'/api/v1/books/books/{self.book.slug}/'

    def test_list_books(self):
        """
        Teste para listar livros
        """
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_retrieve_book(self):
        """
        Teste para recuperar um livro específico
        """
        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Book')
        self.assertEqual(response.data['description'], 'This is a test book description')

    def test_create_book(self):
        """
        Teste para criar um livro
        """
        self.client.force_authenticate(user=self.user)

        data = {
            'title': 'New Book',
            'description': 'This is a new book description that is long enough to pass validation',
            'category': self.category.id
        }
        response = self.client.post(self.list_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Book')
        self.assertEqual(response.data['description'], 'This is a new book description that is long enough to pass validation')

        # Verificar se o livro foi criado no banco de dados
        self.assertGreaterEqual(Book.objects.count(), 2)

    def test_update_book(self):
        """
        Teste para atualizar um livro
        """
        self.client.force_authenticate(user=self.user)

        data = {
            'title': 'Updated Book',
            'description': 'This is an updated book description that is long enough to pass validation'
        }
        response = self.client.patch(self.detail_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Book')
        self.assertEqual(response.data['description'], 'This is an updated book description that is long enough to pass validation')

        # Verificar se o livro foi atualizado no banco de dados
        self.book.refresh_from_db()
        self.assertEqual(self.book.title, 'Updated Book')
        self.assertEqual(self.book.description, 'This is an updated book description that is long enough to pass validation')

    def test_delete_book(self):
        """
        Teste para excluir um livro
        """
        self.client.force_authenticate(user=self.user)

        # Criar um livro específico para excluir
        book_to_delete = Book.objects.create(
            title='Book to Delete',
            description='This is a book that will be deleted',
            category=self.category
        )
        delete_url = f'/api/v1/books/books/{book_to_delete.slug}/'

        response = self.client.delete(delete_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Book.objects.filter(slug=book_to_delete.slug).exists())

    def test_validation_errors(self):
        """
        Teste para validação de erros
        """
        self.client.force_authenticate(user=self.user)

        data = {
            'title': '',  # Título vazio deve falhar
            'description': 'Short'  # Descrição muito curta deve falhar
        }
        response = self.client.post(self.list_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', response.data)
        self.assertIn('description', response.data)

    def test_upload_cover_image(self):
        """
        Teste para upload de imagem de capa
        """
        self.client.force_authenticate(user=self.user)

        # Criar uma imagem temporária
        with tempfile.NamedTemporaryFile(suffix='.jpg') as image_file:
            img = Image.new('RGB', (100, 100), color='red')
            img.save(image_file, format='JPEG')
            image_file.seek(0)

            data = {
                'cover_image': image_file
            }
            response = self.client.patch(self.detail_url, data, format='multipart')

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('cover_image', response.data)
            self.assertIsNotNone(response.data['cover_image'])

            # Limpar o arquivo de imagem após o teste
            self.book.refresh_from_db()
            if self.book.cover_image:
                if os.path.exists(self.book.cover_image.path):
                    os.remove(self.book.cover_image.path)
