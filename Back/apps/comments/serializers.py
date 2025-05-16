"""
Serializadores para o app de comentários universal
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404

from .models import Comment

User = get_user_model()


class RecursiveCommentSerializer(serializers.Serializer):
    """Para serializar recursivamente respostas dos comentários"""
    def to_representation(self, value):
        serializer = CommentSerializer(value, context=self.context)
        return serializer.data


class UserSerializer(serializers.ModelSerializer):
    """Serializador simplificado para usuários"""
    class Meta:
        model = User
        fields = ['id', 'username', 'avatar']


class CommentSerializer(serializers.ModelSerializer):
    """Serializador para comentários universais"""
    replies = RecursiveCommentSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    
    # Campos para criação de comentários
    content_type_str = serializers.CharField(write_only=True)
    object_id = serializers.IntegerField(write_only=True)
    parent_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    # Campos adicionais
    reply_count = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'user', 'content', 'created_at', 'updated_at',
            'replies', 'reply_count', 'parent', 'content_type_str', 'object_id', 'parent_id',
            'name', 'email', 'is_approved', 'is_spam'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'parent', 'is_approved', 'is_spam'
        ]

    def get_reply_count(self, obj):
        """Retorna o número de respostas a este comentário"""
        return obj.replies.filter(is_approved=True, is_spam=False).count()

    def create(self, validated_data):
        """Cria um novo comentário"""
        # Extrair dados específicos
        content_type_str = validated_data.pop('content_type_str')
        object_id = validated_data.pop('object_id')
        parent_id = validated_data.pop('parent_id', None)
        
        # Obter o ContentType
        app_label, model = content_type_str.split('.')
        content_type = ContentType.objects.get(app_label=app_label, model=model)
        
        # Verificar se o objeto existe
        model_class = content_type.model_class()
        content_object = get_object_or_404(model_class, id=object_id)
        
        # Preparar dados do comentário
        comment_data = {
            'content_type': content_type,
            'object_id': object_id,
            'content': validated_data.get('content'),
            'user': self.context['request'].user,
            'name': validated_data.get('name'),
            'email': validated_data.get('email'),
        }
        
        # Adicionar informações de rastreamento
        request = self.context.get('request')
        if request:
            comment_data['ip_address'] = self.get_client_ip(request)
            comment_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
        
        # Adicionar comentário pai se for uma resposta
        if parent_id:
            parent = get_object_or_404(Comment, id=parent_id)
            # Verificar se o parent pertence ao mesmo objeto
            if parent.content_type_id != content_type.id or parent.object_id != object_id:
                raise serializers.ValidationError(
                    "O comentário pai deve pertencer ao mesmo objeto"
                )
            comment_data['parent'] = parent
        
        # Criar o comentário
        return Comment.objects.create(**comment_data)
    
    def get_client_ip(self, request):
        """Obtém o IP do cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
