from rest_framework import serializers
from .models import Category

class CategorySerializer(serializers.ModelSerializer):
    articles_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'created_at', 'articles_count']
        read_only_fields = ['id', 'slug', 'created_at', 'articles_count']
        
    def get_articles_count(self, obj):
        return obj.articles.count() if hasattr(obj, 'articles') else 0
