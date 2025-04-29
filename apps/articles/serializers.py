from rest_framework import serializers
from .models import Article, Comment


class RecursiveCommentSerializer(serializers.Serializer):
    """Para serializar recursivamente respostas dos comentários"""
    def to_representation(self, value):
        serializer = CommentSerializer(value, context=self.context)
        return serializer.data


class CommentSerializer(serializers.ModelSerializer):
    replies = RecursiveCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'name', 'text', 'created_at', 'replies', 'parent']
        ref_name = "ArticlesCommentSerializer"


class ArticleSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Article
        fields = ['title', 'slug', 'content', 'created_at', 'comments']
        read_only_fields = ['slug', 'created_at']