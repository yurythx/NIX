"""
Serializadores para comentários de livros
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .comments import BookComment
from .models import Book

User = get_user_model()

class RecursiveBookCommentSerializer(serializers.Serializer):
    """Para serializar recursivamente respostas dos comentários"""
    def to_representation(self, value):
        serializer = BookCommentSerializer(value, context=self.context)
        return serializer.data

class UserSerializer(serializers.ModelSerializer):
    """Serializador simplificado para usuários"""
    class Meta:
        model = User
        fields = ['id', 'username', 'avatar']

class BookCommentSerializer(serializers.ModelSerializer):
    """Serializador para comentários de livros"""
    replies = RecursiveBookCommentSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    book_slug = serializers.CharField(write_only=True)
    parent_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    reply_count = serializers.SerializerMethodField()

    class Meta:
        model = BookComment
        fields = [
            'id', 'user', 'content', 'created_at', 'updated_at',
            'replies', 'reply_count', 'parent', 'book_slug', 'parent_id',
            'is_approved', 'is_spam'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'parent', 'is_approved', 'is_spam']

    def get_reply_count(self, obj):
        """Retorna o número de respostas a este comentário"""
        return obj.replies.filter(is_approved=True, is_spam=False).count()

    def create(self, validated_data):
        """Cria um novo comentário"""
        # Extrair dados específicos
        book_slug = validated_data.pop('book_slug')
        parent_id = validated_data.pop('parent_id', None)

        # Obter o livro pelo slug
        book = get_object_or_404(Book, slug=book_slug)

        # Preparar dados do comentário
        comment_data = {
            'book': book,
            'content': validated_data.get('content'),
            'user': self.context['request'].user,
        }

        # Adicionar comentário pai se for uma resposta
        if parent_id:
            parent = get_object_or_404(BookComment, id=parent_id)
            # Verificar se o parent pertence ao mesmo livro
            if parent.book_id != book.id:
                raise serializers.ValidationError("O comentário pai deve pertencer ao mesmo livro")
            comment_data['parent'] = parent

        # Criar o comentário
        return BookComment.objects.create(**comment_data)
