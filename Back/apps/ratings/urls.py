from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RatingViewSet

# Criar router e registrar ViewSets
router = DefaultRouter()
router.register(r'', RatingViewSet, basename='rating')

# URLs da API
urlpatterns = [
    path('', include(router.urls)),
]
