from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from django.views.generic import TemplateView

schema_view = get_schema_view(
    openapi.Info(
        title="NIX API",
        default_version='v1',
        description="API Para Projetos com com Django REST Framework",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contato@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
    url=settings.BASE_URL if hasattr(settings, 'BASE_URL') else None,
    validators=['ssv', 'flex'],
)

# Padrão de versionamento de API
api_prefix = 'api/v1/'

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # Authentication
    path(f'{api_prefix}auth/', include('djoser.urls')),
    path(f'{api_prefix}auth/', include('djoser.urls.jwt')),
    
    # App URLs
    path(f'{api_prefix}accounts/', include('apps.accounts.urls')),
    path(f'{api_prefix}projects/boards/', include('apps.projects.boards.urls')),
    path(f'{api_prefix}projects/tasks/', include('apps.projects.tasks.urls')),
    path(f'{api_prefix}projects/teams/', include('apps.projects.teams.urls')),
    path(f'{api_prefix}projects/comments/', include('apps.projects.comments.urls')),
    path(f'{api_prefix}articles/', include('apps.articles.urls')), 
]

# Add media URL in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)