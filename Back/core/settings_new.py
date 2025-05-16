import os
import sys
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# Caminho base do projeto
BASE_DIR = Path(__file__).resolve().parent.parent

# Carregar variáveis de ambiente
load_dotenv(os.path.join(BASE_DIR, '.env'))

# Ambiente
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')

# Configurações de segurança
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-key-for-dev')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

# Configurações de segurança adicionais
USE_SECURITY_SETTINGS = ENVIRONMENT == 'production'

if USE_SECURITY_SETTINGS:
    SECURE_SSL_REDIRECT = USE_SECURITY_SETTINGS
    SESSION_COOKIE_SECURE = USE_SECURITY_SETTINGS
    CSRF_COOKIE_SECURE = USE_SECURITY_SETTINGS
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = 31536000 if USE_SECURITY_SETTINGS else 0
    SECURE_HSTS_INCLUDE_SUBDOMAINS = USE_SECURITY_SETTINGS
    SECURE_HSTS_PRELOAD = USE_SECURITY_SETTINGS
    X_FRAME_OPTIONS = 'DENY'

# URL base para documentação da API
BASE_URL = 'http://127.0.0.1:8000' if DEBUG else os.getenv('BASE_URL', 'http://127.0.0.1:8000')

# Aplicações
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Terceiros
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'djoser',
    'drf_yasg',

    'axes',

    # Apps locais
    'apps.accounts',
    'apps.articles',
    'apps.categories',
    'apps.mangas',

]

# Middleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'axes.middleware.AxesMiddleware',
    'core.middleware.ExceptionMiddleware',  # Middleware personalizado para tratar exceções
]

# Configurações de cache
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Configurações de logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

# Configurações de rate limiting
RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = 'default'
RATELIMIT_KEY_PREFIX = 'ratelimit'

# Configurações de backup
BACKUP_ROOT = os.path.join(BASE_DIR, 'backups')
BACKUP_FORMAT = '%Y-%m-%d_%H-%M-%S'

# Resto das configurações existentes...
ROOT_URLCONF = 'core.urls'

# Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Banco de Dados
DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.sqlite3'),
        'NAME': os.getenv('DB_NAME', BASE_DIR / 'db.sqlite3'),
        'USER': os.getenv('DB_USER', ''),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', ''),
    }
}

# Validações de senha
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Usuário customizado
AUTH_USER_MODEL = 'accounts.User'

# Configurações do Axes
AXES_ENABLED = True
AXES_FAILURE_LIMIT = 5
AXES_LOCK_OUT_AT_FAILURE = True
AXES_COOLOFF_TIME = 1  # 1 hora
AXES_RESET_ON_SUCCESS = True
AXES_ENABLE_ADMIN = False
AXES_HANDLER = 'axes.handlers.database.AxesDatabaseHandler'
AXES_DISABLE_ACCESS_LOG = True

# Novas configurações recomendadas
AXES_LOCKOUT_PARAMETERS = ['username', 'ip_address']
AXES_VERBOSE = True
AXES_LOCKOUT_TEMPLATE = None
AXES_USE_USER_AGENT = False  # Removido pois está obsoleto
AXES_ONLY_USER_FAILURES = False  # Removido pois está obsoleto

AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# Internacionalização
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# Arquivos estáticos e de mídia
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'rest_framework.schemas.coreapi.AutoSchema',
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.URLPathVersioning',
    # Usando o manipulador de exceções padrão do DRF
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
}

# Simple JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('ACCESS_TOKEN_LIFETIME', 1440))),
    'REFRESH_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('REFRESH_TOKEN_LIFETIME', 10080))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS
# Obter origens permitidas da variável de ambiente ou usar padrões de desenvolvimento
CORS_ALLOWED_ORIGINS_ENV = os.getenv('CORS_ALLOWED_ORIGINS', '')
if CORS_ALLOWED_ORIGINS_ENV:
    CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS_ENV.split(',')
else:
    # Origens padrão para desenvolvimento
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

# Adicionar origens específicas para ambiente de produção
if ENVIRONMENT == 'production':
    # Verificar se há origens de produção definidas
    PROD_CORS_ORIGINS = os.getenv('PROD_CORS_ALLOWED_ORIGINS', '')
    if PROD_CORS_ORIGINS:
        CORS_ALLOWED_ORIGINS.extend(PROD_CORS_ORIGINS.split(','))

# Configurações adicionais de CORS
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'access-control-allow-origin',
    'access-control-allow-methods',
    'access-control-allow-headers',
]
CORS_EXPOSE_HEADERS = [
    'access-control-allow-origin',
    'access-control-allow-methods',
    'access-control-allow-headers',
]

# Djoser
DJOSER = {
    'PASSWORD_RESET_CONFIRM_URL': 'password/reset/confirm/{uid}/{token}',
    'USERNAME_RESET_CONFIRM_URL': 'username/reset/confirm/{uid}/{token}',
    'ACTIVATION_URL': 'activate/{uid}/{token}',
    'SEND_ACTIVATION_EMAIL': True,
    'SERIALIZERS': {},
    'LOGIN_FIELD': 'email',
    'USER_CREATE_PASSWORD_RETYPE': True,
    'PASSWORD_RESET_CONFIRM_RETYPE': True,
    'TOKEN_MODEL': None,
}

# Email (modo dev)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Configurações de upload de arquivos
DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB
MAX_UPLOAD_SIZE = 104857600  # 100MB
