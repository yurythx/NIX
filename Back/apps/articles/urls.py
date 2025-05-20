from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArticleViewSet, TagViewSet, CommentViewSet

# Criar router e registrar ViewSets
router = DefaultRouter()
router.register(r'articles', ArticleViewSet)
router.register(r'tags', TagViewSet)
router.register(r'comments', CommentViewSet)

# URLs da API
urlpatterns = [
    path('', include(router.urls)),
]
