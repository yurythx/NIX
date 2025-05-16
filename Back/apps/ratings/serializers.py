from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Rating

class RatingSerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo Rating
    """
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Rating
        fields = ['id', 'user', 'username', 'content_type', 'object_id', 'value', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'username', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Obter o usuário da requisição
        user = self.context['request'].user
        validated_data['user'] = user
        
        # Verificar se o usuário já avaliou este item
        content_type = validated_data.get('content_type')
        object_id = validated_data.get('object_id')
        
        existing_rating = Rating.objects.filter(
            user=user,
            content_type=content_type,
            object_id=object_id
        ).first()
        
        if existing_rating:
            # Atualizar avaliação existente
            for key, value in validated_data.items():
                setattr(existing_rating, key, value)
            existing_rating.save()
            return existing_rating
        
        # Criar nova avaliação
        return super().create(validated_data)

class RatingSummarySerializer(serializers.Serializer):
    """
    Serializer para o resumo de avaliações
    """
    average = serializers.FloatField()
    total = serializers.IntegerField()
    counts = serializers.DictField(
        child=serializers.IntegerField()
    )
    
    def to_representation(self, instance):
        # Garantir que todas as chaves de 1 a 5 estejam presentes
        counts = instance.get('counts', {})
        for i in range(1, 6):
            if i not in counts:
                counts[i] = 0
        
        # Ordenar as chaves
        sorted_counts = {str(k): counts[k] for k in sorted(counts.keys())}
        
        return {
            'average': instance.get('average', 0),
            'total': instance.get('total', 0),
            'counts': sorted_counts
        }

class ContentTypeSerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo ContentType
    """
    class Meta:
        model = ContentType
        fields = ['id', 'app_label', 'model']
