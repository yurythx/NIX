from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, UserSettingsViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'settings', UserSettingsViewSet)

urlpatterns = [
    path('', include(router.urls)),
]