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
        title="Viixen API",
        default_version='v1',
        description="""
        API do projeto Viixen para gerenciamento de conteúdo digital.

        ## Recursos Disponíveis

        * **Usuários**: Gerenciamento de contas de usuário
        * **Artigos**: Publicação e gerenciamento de artigos
        * **Mangás**: Leitura e gerenciamento de mangás
        * **Livros**: Leitura e gerenciamento de livros
        * **Categorias**: Organização de conteúdo por categorias
        * **Avaliações**: Sistema de avaliações para conteúdos

        ## Autenticação

        A API utiliza autenticação JWT (JSON Web Token). Para acessar endpoints protegidos,
        é necessário obter um token através do endpoint `/api/v1/auth/jwt/create/` e incluí-lo
        no cabeçalho das requisições como `Authorization: Bearer {token}`.
        """,
        terms_of_service="https://www.viixen.com/terms/",
        contact=openapi.Contact(email="contato@viixen.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
    url=settings.BASE_URL if hasattr(settings, 'BASE_URL') else None,
    patterns=[
        path('api/v1/accounts/', include('apps.accounts.urls')),
        path('api/v1/articles/', include('apps.articles.urls')),
        path('api/v1/mangas/', include('apps.mangas.urls')),
        path('api/v1/books/', include('apps.books.urls')),
        path('api/v1/categories/', include('apps.categories.urls')),
        path('api/v1/comments/', include('apps.comments.urls')),
        # Excluindo ratings temporariamente
        # path('api/v1/ratings/', include('apps.ratings.urls')),
    ],
)

# Padrão de versionamento de API
api_prefix = 'api/v1/'

urlpatterns = [
    path('admin/', admin.site.urls),

    # API Documentation - Temporariamente desabilitado
    # path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    # path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    # path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    # Página de documentação alternativa
    path('api-docs/', TemplateView.as_view(template_name='api_docs.html'), name='api-docs'),

    # API Root
    path(f'{api_prefix}', include('core.api_urls')),

    # Authentication
    path(f'{api_prefix}auth/', include('djoser.urls')),
    path(f'{api_prefix}auth/', include('djoser.urls.jwt')),

    # App URLs
    path(f'{api_prefix}accounts/', include('apps.accounts.urls')),
    path(f'{api_prefix}articles/', include('apps.articles.urls')),
    path(f'{api_prefix}mangas/', include('apps.mangas.urls')),
    path(f'{api_prefix}books/', include('apps.books.urls')),
    path(f'{api_prefix}categories/', include('apps.categories.urls')),
    path(f'{api_prefix}ratings/', include('apps.ratings.urls')),
    path(f'{api_prefix}comments/', include('apps.comments.urls')),
]

# Add media URL in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
