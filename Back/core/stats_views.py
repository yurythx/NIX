from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta

# Importar modelos
from apps.articles.models import Article
from apps.books.models import Book
from apps.mangas.models import Manga, Chapter, MangaView
from apps.accounts.models import User

@api_view(['GET'])
def global_statistics(request):
    """
    Retorna estatísticas globais para artigos, livros e mangás.
    """
    # Usar cache para evitar consultas frequentes ao banco de dados
    cache_key = 'global_statistics'
    cached_stats = cache.get(cache_key)
    
    if cached_stats:
        return Response(cached_stats)
    
    # Estatísticas de artigos
    article_stats = {
        'total': Article.objects.count(),
        'views': Article.objects.aggregate(total_views=Sum('views_count'))['total_views'] or 0,
        'recent': Article.objects.filter(created_at__gte=timezone.now() - timedelta(days=30)).count(),
        'most_viewed': list(Article.objects.order_by('-views_count')[:5].values('title', 'slug', 'views_count')),
    }
    
    # Estatísticas de livros
    book_stats = {
        'total': Book.objects.count(),
        'views': Book.objects.aggregate(total_views=Sum('views_count'))['total_views'] or 0,
        'recent': Book.objects.filter(created_at__gte=timezone.now() - timedelta(days=30)).count(),
        'most_viewed': list(Book.objects.order_by('-views_count')[:5].values('title', 'slug', 'views_count')),
    }
    
    # Estatísticas de mangás
    manga_stats = {
        'total': Manga.objects.count(),
        'views': Manga.objects.aggregate(total_views=Sum('views_count'))['total_views'] or 0,
        'chapters': Chapter.objects.count(),
        'recent': Manga.objects.filter(created_at__gte=timezone.now() - timedelta(days=30)).count(),
        'most_viewed': list(Manga.objects.order_by('-views_count')[:5].values('title', 'slug', 'views_count')),
    }
    
    # Estatísticas de usuários
    user_stats = {
        'total': User.objects.count(),
        'active': User.objects.filter(last_login__gte=timezone.now() - timedelta(days=30)).count(),
    }
    
    # Estatísticas gerais
    general_stats = {
        'total_content': article_stats['total'] + book_stats['total'] + manga_stats['total'],
        'total_views': article_stats['views'] + book_stats['views'] + manga_stats['views'],
    }
    
    # Combinar todas as estatísticas
    stats = {
        'articles': article_stats,
        'books': book_stats,
        'mangas': manga_stats,
        'users': user_stats,
        'general': general_stats,
        'timestamp': timezone.now().isoformat(),
    }
    
    # Armazenar em cache por 1 hora
    cache.set(cache_key, stats, 3600)
    
    return Response(stats)
