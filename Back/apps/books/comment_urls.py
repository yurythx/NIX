"""
URLs para comentários de livros
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .comment_views import BookCommentViewSet

# Criar um router e registrar os viewsets
router = DefaultRouter()
router.register(r'comments', BookCommentViewSet, basename='book-comment')

# Padrões de URL para comentários de livros
urlpatterns = [
    path('', include(router.urls)),
]
