"""
Testes para verificar o funcionamento do cache
"""

from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.cache import cache
from ..models import Book
from apps.categories.models import Category
import time

User = get_user_model()


@override_settings(CACHES={
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'TIMEOUT': 300,
    }
})
class BookCacheTestCase(TestCase):
    """
    Testes para verificar o funcionamento do cache nos endpoints de livros
    """
    def setUp(self):
        """
        Configuração inicial para os testes
        """
        # Limpar o cache
        cache.clear()
        
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
    
    def test_list_books_cache(self):
        """
        Teste para verificar se o cache está funcionando para a listagem de livros
        """
        # Primeira requisição (não deve estar em cache)
        start_time = time.time()
        response1 = self.client.get(self.list_url)
        end_time = time.time()
        first_request_time = end_time - start_time
        
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        # Segunda requisição (deve estar em cache)
        start_time = time.time()
        response2 = self.client.get(self.list_url)
        end_time = time.time()
        second_request_time = end_time - start_time
        
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        # Verificar se as respostas são iguais
        self.assertEqual(response1.data, response2.data)
        
        # Terceira requisição com nocache=true (não deve usar cache)
        response3 = self.client.get(f"{self.list_url}?nocache=true")
        
        self.assertEqual(response3.status_code, status.HTTP_200_OK)
        
        # Criar um novo livro para verificar se a resposta com nocache é diferente
        Book.objects.create(
            title='New Test Book',
            description='This is a new test book description',
            category=self.category
        )
        
        # Quarta requisição com nocache=true (deve mostrar o novo livro)
        response4 = self.client.get(f"{self.list_url}?nocache=true")
        
        self.assertEqual(response4.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response4.data['results']), 2)
        
        # Quinta requisição sem nocache (deve ainda mostrar apenas o livro original devido ao cache)
        response5 = self.client.get(self.list_url)
        
        self.assertEqual(response5.status_code, status.HTTP_200_OK)
        self.assertEqual(response5.data, response2.data)
    
    def test_detail_book_cache(self):
        """
        Teste para verificar se o cache está funcionando para os detalhes de um livro
        """
        # Primeira requisição (não deve estar em cache)
        start_time = time.time()
        response1 = self.client.get(self.detail_url)
        end_time = time.time()
        first_request_time = end_time - start_time
        
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        # Segunda requisição (deve estar em cache)
        start_time = time.time()
        response2 = self.client.get(self.detail_url)
        end_time = time.time()
        second_request_time = end_time - start_time
        
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        # Verificar se as respostas são iguais
        self.assertEqual(response1.data, response2.data)
        
        # Terceira requisição com nocache=true (não deve usar cache)
        response3 = self.client.get(f"{self.detail_url}?nocache=true")
        
        self.assertEqual(response3.status_code, status.HTTP_200_OK)
        self.assertEqual(response3.data, response2.data)  # Conteúdo deve ser o mesmo, mas não veio do cache
