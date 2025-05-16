"""
URLs para o app de comentários universal
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommentViewSet

# Criar um router e registrar os viewsets
router = DefaultRouter()
router.register(r'', CommentViewSet, basename='comment')

# Padrões de URL para o app de comentários
urlpatterns = [
    path('', include(router.urls)),
]
