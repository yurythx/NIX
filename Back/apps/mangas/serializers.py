from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Manga, Chapter, Page, ReadingProgress, Comment, UserStatistics, MangaView

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = ['id', 'image', 'page_number']

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'content', 'created_at']
        read_only_fields = ['user']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ChapterSerializer(serializers.ModelSerializer):
    pages = PageSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    chapter_type_display = serializers.SerializerMethodField()

    class Meta:
        model = Chapter
        fields = ['id', 'title', 'number', 'chapter_type', 'chapter_type_display', 'pdf_file', 'pdf_file_path',
                 'pages', 'comments', 'comments_count', 'created_at']

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_chapter_type_display(self, obj):
        return obj.get_chapter_type_display()

class ReadingProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReadingProgress
        fields = ['id', 'chapter', 'page', 'last_read']
        read_only_fields = ['user', 'manga']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['manga'] = self.context.get('manga')
        return super().create(validated_data)

class MangaSerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)
    is_favorite = serializers.SerializerMethodField()
    reading_progress = serializers.SerializerMethodField()
    genres_list = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = Manga
        fields = [
            'id', 'title', 'slug', 'description', 'cover',
            'author', 'genres', 'genres_list', 'status', 'status_display',
            'chapters', 'is_favorite', 'reading_progress', 'created_at',
            'views_count'
        ]

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorites.filter(id=request.user.id).exists()
        return False

    def get_reading_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                progress = ReadingProgress.objects.get(user=request.user, manga=obj)
                return {
                    'chapter': progress.chapter.number,
                    'page': progress.page.page_number if progress.page else None,
                    'last_read': progress.last_read
                }
            except ReadingProgress.DoesNotExist:
                return None
        return None

    def get_genres_list(self, obj):
        if obj.genres:
            return [genre.strip() for genre in obj.genres.split(',')]
        return []

    def get_status_display(self, obj):
        return obj.get_status_display()

class UserStatisticsSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = UserStatistics
        fields = ['id', 'username', 'total_chapters_read', 'total_pages_read', 'reading_time_minutes', 'last_updated']
        read_only_fields = ['user']

    def get_username(self, obj):
        return obj.user.username

class MangaViewSerializer(serializers.ModelSerializer):
    manga_title = serializers.SerializerMethodField()

    class Meta:
        model = MangaView
        fields = ['id', 'manga', 'manga_title', 'view_count', 'last_viewed']
        read_only_fields = ['user', 'manga']

    def get_manga_title(self, obj):
        return obj.manga.title