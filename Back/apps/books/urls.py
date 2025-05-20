"""
URLs para o app de livros
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet
from .views_async import AsyncBookViewSet
from .chunked_upload import ChunkedUploadView

# Criar um router e registrar os viewsets
router = DefaultRouter()
router.register(r'books', BookViewSet)

# Criar um router para as views assíncronas
async_router = DefaultRouter()
async_router.register(r'books', AsyncBookViewSet)



# Padrões de URL para o app de livros
urlpatterns = [
    path('', include(router.urls)),
    path('async/', include(async_router.urls)),
    path('chunked-upload/', ChunkedUploadView.as_view(), name='chunked-upload'),
]
