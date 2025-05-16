from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArticleViewSet, CommentViewSet, TagViewSet

# Criar router e registrar ViewSets
router = DefaultRouter()
router.register(r'articles', ArticleViewSet)
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'tags', TagViewSet)

# URLs da API
urlpatterns = [
    path('', include(router.urls)),
]
