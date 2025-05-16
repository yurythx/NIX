from django.urls import path, include
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.routers import DefaultRouter
from .views import (
    MangaViewSet, ChapterViewSet, PageViewSet,
    UserStatisticsViewSet, MangaViewViewSet,
    convert_pdf_page, get_pdf_info, test_endpoint, test_mangas_endpoint
)
from .chunked_upload import ChunkedUploadView

router = DefaultRouter()
router.register(r'mangas', MangaViewSet)
router.register(r'chapters', ChapterViewSet)
router.register(r'pages', PageViewSet)
router.register(r'statistics', UserStatisticsViewSet)
router.register(r'history', MangaViewViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('chunked-upload/', ChunkedUploadView.as_view(), name='chunked-upload'),
    path('pdf/convert/', convert_pdf_page, name='convert-pdf-page'),
    path('pdf/info/', get_pdf_info, name='get-pdf-info'),
    path('test/', test_endpoint, name='test-endpoint'),
    path('mangas-test/', test_mangas_endpoint, name='mangas-test'),
    # Adicionar um endpoint alternativo para mangás que não depende do modelo Manga
    path('mangas-mock/', test_mangas_endpoint, name='mangas-mock'),
]
