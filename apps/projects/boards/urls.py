from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BoardViewSet, ColumnViewSet, LabelViewSet

router = DefaultRouter()
router.register(r'', BoardViewSet)
router.register(r'columns', ColumnViewSet)
router.register(r'labels', LabelViewSet)

urlpatterns = [
    path('', include(router.urls)),
]