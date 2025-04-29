from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Comment

User = get_user_model()

class CommentSerializer(serializers.ModelSerializer):
    """
    Serializador para comentários.
    """
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    username = serializers.ReadOnlyField(source='user.username')
    mentioned_users = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = Comment
        fields = ['id', 'task', 'user', 'username', 'content', 'mentioned_users', 
                  'created_at', 'updated_at', 'is_edited']
        read_only_fields = ['id', 'user', 'username', 'created_at', 'updated_at', 'is_edited']
        ref_name = "ProjectsCommentSerializer"
    
    def create(self, validated_data):
        """Atribui o usuário atual como autor do comentário."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
