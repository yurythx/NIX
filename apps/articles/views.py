from rest_framework import viewsets, permissions
from .models import Article, Comment
from .serializers import ArticleSerializer, CommentSerializer
from django.shortcuts import get_object_or_404


class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        article_slug = self.request.data.get('article_slug')
        article = get_object_or_404(Article, slug=article_slug)
        serializer.save(article=article)