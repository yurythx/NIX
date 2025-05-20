from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Swagger / OpenAPI
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Views internas
from .views import (
    index,
    system_stats,
    db_stats,
    health_check,
    api_root,
    server_status,
)
from .stats_views import global_statistics

# Prefixo de versão da API
API_PREFIX = 'api/v1/'

# Documentação da API
schema_view = get_schema_view(
    openapi.Info(
        title="Viixen API",
        default_version='v1',
        description="""
API do projeto **Viixen** para gerenciamento de conteúdo digital.

### Recursos Disponíveis
- **Usuários**: Gerenciamento de contas
- **Artigos**: Publicação e administração
- **Mangás**: Leitura e gerenciamento
- **Livros**: Leitura e gerenciamento
- **Categorias**: Organização por tema
- **Avaliações**: Sistema de notas e feedback

### Autenticação
A autenticação é baseada em JWT (JSON Web Token).  
Para obter um token, acesse:  
`/api/v1/auth/jwt/create/`  
Use o cabeçalho: `Authorization: Bearer <seu_token>`
        """,
        terms_of_service="https://www.viixen.com/terms/",
        contact=openapi.Contact(email="contato@viixen.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
    url=getattr(settings, 'BASE_URL', None),
    patterns=[
        path(f'{API_PREFIX}accounts/', include('apps.accounts.urls')),
        path(f'{API_PREFIX}articles/', include('apps.articles.urls')),
        path(f'{API_PREFIX}mangas/', include('apps.mangas.urls')),
        path(f'{API_PREFIX}books/', include('apps.books.urls')),
        path(f'{API_PREFIX}categories/', include('apps.categories.urls')),
    ]
)

# -------------------------------
# URL Patterns
# -------------------------------
urlpatterns = [

    # Admin
    path('admin/', admin.site.urls),

    # Página inicial / status
    path('', index, name='index'),
    path('status/', server_status, name='server-status'),

    # API pública / estatísticas
    path(f'{API_PREFIX}', api_root, name='api-root'),
    path(f'{API_PREFIX}system-stats/', system_stats, name='system_stats'),
    path(f'{API_PREFIX}db-stats/', db_stats, name='db_stats'),
    path(f'{API_PREFIX}health/', health_check, name='health_check'),
    path(f'{API_PREFIX}global-stats/', global_statistics, name='global_statistics'),

    # Autenticação (Djoser + JWT)
    path(f'{API_PREFIX}auth/', include('djoser.urls')),
    path(f'{API_PREFIX}auth/', include('djoser.urls.jwt')),

    # Apps principais
    path(f'{API_PREFIX}accounts/', include('apps.accounts.urls')),
    path(f'{API_PREFIX}articles/', include('apps.articles.urls')),
    path(f'{API_PREFIX}mangas/', include('apps.mangas.urls')),
    path(f'{API_PREFIX}books/', include('apps.books.urls')),
    path(f'{API_PREFIX}categories/', include('apps.categories.urls')),

    # Documentação da API
    path(f'{API_PREFIX}docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path(f'{API_PREFIX}redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Servir arquivos de mídia no modo de desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)