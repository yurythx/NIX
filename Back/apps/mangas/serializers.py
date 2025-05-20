from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Manga, Chapter, Page, ReadingProgress, UserStatistics, MangaView
from apps.categories.serializers import CategorySerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = ['id', 'number', 'image', 'chapter']

class ChapterSerializer(serializers.ModelSerializer):
    pages = PageSerializer(many=True, read_only=True)
    pages_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Chapter
        fields = ['id', 'number', 'title', 'pages', 'pages_count', 'created_at', 'manga']
    
    def get_pages_count(self, obj):
        return obj.pages.count()

class MangaSerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)
    chapters_count = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    is_favorite = serializers.SerializerMethodField()
    
    class Meta:
        model = Manga
        fields = [
            'id', 'title', 'slug', 'description', 'cover_image', 
            'author', 'artist', 'status', 'year', 'genres',
            'chapters', 'chapters_count', 'category', 'is_favorite',
            'created_at', 'updated_at', 'views_count', 'favorites'
        ]
    
    def get_chapters_count(self, obj):
        return obj.chapters.count()
    
    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorites.filter(id=request.user.id).exists()
        return False

class ReadingProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReadingProgress
        fields = ['id', 'user', 'manga', 'chapter', 'page', 'last_read', 'completed']

class UserStatisticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStatistics
        fields = ['id', 'user', 'manga', 'chapters_read', 'total_pages_read', 'time_spent', 'last_activity']

class MangaViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = MangaView
        fields = ['id', 'manga', 'user', 'timestamp', 'session_id']
