from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MangaViewSet, ChapterViewSet,
    UserStatisticsViewSet, MangaViewViewSet,
    convert_pdf_page, get_pdf_info
)
from .chunked_upload import ChunkedUploadView

router = DefaultRouter()
router.register(r'mangas', MangaViewSet)
router.register(r'chapters', ChapterViewSet)

router.register(r'statistics', UserStatisticsViewSet)
router.register(r'history', MangaViewViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('chunked-upload/', ChunkedUploadView.as_view(), name='chunked-upload'),
    path('pdf/convert/', convert_pdf_page, name='convert-pdf-page'),
    path('pdf/info/', get_pdf_info, name='get-pdf-info'),
]
