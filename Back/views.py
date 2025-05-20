"""
Views para o core do projeto
"""

from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer, TemplateHTMLRenderer
from django.http import JsonResponse
from django.utils.timezone import now
from django.db import connection
from django.db.models import Count
from django.conf import settings
from django.shortcuts import render
import platform
import os
import psutil
import django
import time
import datetime

# Registrar o tempo de início do servidor
SERVER_START_TIME = now()

@api_view(['GET'])
def ratelimited_error(request, exception=None):
    """
    View para exibir quando o limite de requisições é excedido
    """
    return Response({
        'error': 'Limite de requisições excedido. Por favor, tente novamente mais tarde.',
        'detail': 'Você excedeu o número máximo de requisições permitidas. Aguarde alguns minutos antes de tentar novamente.'
    }, status=status.HTTP_429_TOO_MANY_REQUESTS)


@api_view(['GET'])
def api_root(request, format=None):
    """
    View para a raiz da API
    """
    return Response({
        'status': 'online',
        'version': '1.0.0',
        'message': 'Bem-vindo à API do NIX',
        'documentation': '/api/v1/docs/',
        'admin': '/admin/',
        'endpoints': {
            'auth': '/api/v1/auth/',
            'accounts': '/api/v1/accounts/',
            'articles': '/api/v1/articles/',
            'books': '/api/v1/books/',
            'mangas': '/api/v1/mangas/',
            'categories': '/api/v1/categories/',
        }
    })


@api_view(['GET'])
@renderer_classes([JSONRenderer, TemplateHTMLRenderer])
def server_status(request):
    """
    View para exibir o status do servidor
    """
    # Calcular o tempo de atividade
    uptime = now() - SERVER_START_TIME
    uptime_str = str(uptime).split('.')[0]  # Remover microssegundos
    
    # Verificar status do banco de dados
    db_status = 'OK'
    try:
        connection.ensure_connection()
    except Exception as e:
        db_status = f'Erro: {str(e)}'
    
    # Obter informações do sistema
    system_info = {
        'os': platform.system(),
        'os_version': platform.version(),
        'python_version': platform.python_version(),
        'django_version': django.__version__,
        'hostname': platform.node(),
        'cpu_count': os.cpu_count(),
        'cpu_usage': f"{psutil.cpu_percent()}%",
        'memory_total': f"{psutil.virtual_memory().total / (1024 * 1024 * 1024):.2f} GB",
        'memory_available': f"{psutil.virtual_memory().available / (1024 * 1024 * 1024):.2f} GB",
        'memory_usage': f"{psutil.virtual_memory().percent}%",
        'disk_usage': f"{psutil.disk_usage('/').percent}%",
    }
    
    # Obter contagem de registros (importar modelos apenas se necessário)
    try:
        from apps.accounts.models import User
        from apps.articles.models import Article
        from apps.books.models import Book
        from apps.mangas.models import Manga
        
        model_counts = {
            'users': User.objects.count(),
            'articles': Article.objects.count(),
            'books': Book.objects.count(),
            'mangas': Manga.objects.count(),
        }
    except Exception as e:
        model_counts = {
            'error': f'Erro ao obter contagem de modelos: {str(e)}'
        }
    
    # Preparar dados para a resposta
    data = {
        'status': 'Online',
        'environment': 'Development' if settings.DEBUG else 'Production',
        'api_version': 'v1',
        'server_time': now(),
        'uptime': uptime_str,
        'database': {
            'status': db_status,
            'engine': connection.vendor,
            'name': connection.settings_dict['NAME'],
        },
        'system': system_info,
        'models': model_counts,
    }
    
    # Verificar o formato solicitado
    if request.accepted_renderer.format == 'html':
        return Response(data, template_name='status.html')
    
    return Response(data)
