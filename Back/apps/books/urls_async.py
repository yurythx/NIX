"""
URLs para as views assíncronas do app de livros
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_async import AsyncBookViewSet

# Criar um router para as views assíncronas
router = DefaultRouter()
router.register(r'books', AsyncBookViewSet)

urlpatterns = [
    path('async/', include(router.urls)),
]
