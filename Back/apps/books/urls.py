"""
URLs para o app de livros
"""

from django.urls import path, include
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.routers import DefaultRouter
from .views import BookViewSet
from .views_async import AsyncBookViewSet
from .chunked_upload import ChunkedUploadView
from .book_comment_views import BookCommentViewSet

# Criar um router e registrar os viewsets
router = DefaultRouter()
router.register(r'books', BookViewSet)
router.register(r'comments', BookCommentViewSet, basename='book-comment')

# Criar um router para as views assíncronas
async_router = DefaultRouter()
async_router.register(r'books', AsyncBookViewSet)

# Endpoint de teste para livros
def test_endpoint(request):
    """
    Endpoint de teste para verificar se a API de livros está funcionando
    """
    return JsonResponse({
        'status': 'success',
        'message': 'API de livros está funcionando',
        'timestamp': timezone.now().isoformat(),
        'service': 'books'
    })

# Padrões de URL para o app de livros
urlpatterns = [
    path('', include(router.urls)),
    path('async/', include(async_router.urls)),
    path('chunked-upload/', ChunkedUploadView.as_view(), name='chunked-upload'),
    path('test/', test_endpoint, name='test-endpoint'),
]
