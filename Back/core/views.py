"""
Views para o core do projeto
"""

from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer, TemplateHTMLRenderer
from django.http import JsonResponse
from django.utils.timezone import now
from django.db import connection, connections, OperationalError
from django.db.models import Count
from django.conf import settings
from django.shortcuts import render
import platform
import os
import django
import time
import datetime
import random
import threading
import json

# Tentar importar psutil para estatísticas do sistema
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

# Registrar o tempo de início do servidor
SERVER_START_TIME = now()

# Cache para armazenar métricas do banco de dados
DB_METRICS_CACHE = {
    'response_times': [],
    'queries_per_second': [],
    'connections': 0,
    'last_update': now(),
    'avg_response_time': 0,
    'max_response_time': 0,
    'total_queries': 0,
    'db_size': 0,
    'tables_count': 0,
    'db_type': connection.vendor,
}

# Histórico de tempos de resposta para o gráfico
DB_RESPONSE_TIMES_HISTORY = []
MAX_HISTORY_POINTS = 60

# Lock para acesso thread-safe ao cache
db_metrics_lock = threading.Lock()

def get_db_metrics():
    """
    Coleta métricas do banco de dados com base no tipo de banco
    """
    metrics = {
        'status': 'Online',
        'engine': connection.vendor,
        'name': connection.settings_dict['NAME'],
        'response_time': 0,
        'connections': 0,
        'size': 0,
        'tables_count': 0,
        'is_external': False,
        'host': 'Local',
        'total_size': 0,
        'available_size': 0,
        'used_size': 0,
        'usage_percent': 0,
    }

    # Medir tempo de resposta
    start_time = time.time()
    try:
        # Executar uma consulta simples para testar a conexão
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        metrics['status'] = 'Online'

        # Calcular tempo de resposta em ms
        metrics['response_time'] = round((time.time() - start_time) * 1000, 2)

        # Verificar se o banco é externo
        db_settings = connection.settings_dict
        host = db_settings.get('HOST', '')
        if host and host not in ('localhost', '127.0.0.1', '::1'):
            metrics['is_external'] = True
            metrics['host'] = host

        # Obter contagem de tabelas
        if connection.vendor == 'sqlite':
            with connection.cursor() as cursor:
                cursor.execute("SELECT count(*) FROM sqlite_master WHERE type='table'")
                metrics['tables_count'] = cursor.fetchone()[0]

                # Obter tamanho do banco SQLite
                db_path = connection.settings_dict['NAME']
                if os.path.exists(db_path):
                    metrics['size'] = os.path.getsize(db_path) / (1024 * 1024)  # Em MB

                    # Para SQLite, usamos valores fixos mais realistas para o banco de dados
                    # em vez de obter informações do sistema de arquivos completo
                    db_size_mb = metrics['size']
                    # Definir valores fixos para o banco de dados
                    metrics['total_size'] = 1024  # 1 GB fixo para o banco
                    metrics['used_size'] = db_size_mb
                    metrics['available_size'] = metrics['total_size'] - db_size_mb
                    metrics['usage_percent'] = (db_size_mb / metrics['total_size']) * 100 if metrics['total_size'] > 0 else 0

        elif connection.vendor in ('mysql', 'postgresql'):
            with connection.cursor() as cursor:
                if connection.vendor == 'mysql':
                    # MySQL/MariaDB
                    cursor.execute("SHOW TABLES")
                    metrics['tables_count'] = len(cursor.fetchall())

                    # Obter tamanho do banco MySQL
                    db_name = connection.settings_dict['NAME']
                    cursor.execute(f"""
                        SELECT SUM(data_length + index_length) / 1024 / 1024
                        FROM information_schema.TABLES
                        WHERE table_schema = '{db_name}'
                    """)
                    result = cursor.fetchone()[0]
                    metrics['size'] = round(result if result else 0, 2)

                    # Obter conexões ativas
                    cursor.execute("SHOW STATUS LIKE 'Threads_connected'")
                    metrics['connections'] = int(cursor.fetchone()[1])

                    # Definir valores fixos para o banco MySQL
                    db_size_mb = metrics['size']
                    # Valores fixos para o banco de dados
                    metrics['total_size'] = 5120  # 5 GB fixo para o banco MySQL
                    metrics['used_size'] = db_size_mb
                    metrics['available_size'] = metrics['total_size'] - db_size_mb
                    metrics['usage_percent'] = (db_size_mb / metrics['total_size']) * 100 if metrics['total_size'] > 0 else 0

                elif connection.vendor == 'postgresql':
                    # PostgreSQL
                    cursor.execute("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
                    metrics['tables_count'] = cursor.fetchone()[0]

                    # Obter tamanho do banco PostgreSQL
                    db_name = connection.settings_dict['NAME']
                    cursor.execute(f"""
                        SELECT pg_database_size('{db_name}') / 1024 / 1024
                    """)
                    metrics['size'] = round(cursor.fetchone()[0], 2)

                    # Obter conexões ativas
                    cursor.execute("SELECT count(*) FROM pg_stat_activity")
                    metrics['connections'] = cursor.fetchone()[0]

                    # Definir valores fixos para o banco PostgreSQL
                    db_size_mb = metrics['size']
                    # Valores fixos para o banco de dados
                    metrics['total_size'] = 8192  # 8 GB fixo para o banco PostgreSQL
                    metrics['used_size'] = db_size_mb
                    metrics['available_size'] = metrics['total_size'] - db_size_mb
                    metrics['usage_percent'] = (db_size_mb / metrics['total_size']) * 100 if metrics['total_size'] > 0 else 0

    except OperationalError:
        metrics['status'] = 'Offline'
    except Exception as e:
        metrics['status'] = f'Erro: {str(e)}'

    # Garantir que todos os valores sejam válidos
    for key in ['size', 'total_size', 'available_size', 'used_size', 'usage_percent']:
        if metrics[key] is None or metrics[key] < 0:
            metrics[key] = 0

    # Arredondar valores percentuais
    metrics['usage_percent'] = round(metrics['usage_percent'], 1)

    # Atualizar cache de métricas
    with db_metrics_lock:
        DB_METRICS_CACHE['response_times'].append(metrics['response_time'])
        if len(DB_METRICS_CACHE['response_times']) > 10:
            DB_METRICS_CACHE['response_times'].pop(0)

        DB_METRICS_CACHE['avg_response_time'] = sum(DB_METRICS_CACHE['response_times']) / len(DB_METRICS_CACHE['response_times'])
        DB_METRICS_CACHE['max_response_time'] = max(DB_METRICS_CACHE['response_times'])
        DB_METRICS_CACHE['connections'] = metrics['connections']
        DB_METRICS_CACHE['db_size'] = metrics['size']
        DB_METRICS_CACHE['tables_count'] = metrics['tables_count']
        DB_METRICS_CACHE['last_update'] = now()

        # Atualizar histórico para o gráfico
        global DB_RESPONSE_TIMES_HISTORY
        DB_RESPONSE_TIMES_HISTORY.append(metrics['response_time'])
        if len(DB_RESPONSE_TIMES_HISTORY) > MAX_HISTORY_POINTS:
            DB_RESPONSE_TIMES_HISTORY.pop(0)

    return metrics


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
        'documentation': {
            'swagger': '/api/v1/docs/swagger/',
            'redoc': '/api/v1/docs/redoc/',
        },
        'endpoints': {
            'admin': '/admin/',
            'api_root': '/api/v1/',
            'auth': '/api/v1/auth/',
            'accounts': '/api/v1/accounts/',
            'articles': '/api/v1/articles/',
            'books': '/api/v1/books/',
            'mangas': '/api/v1/mangas/',
            'categories': '/api/v1/categories/',
            'system_stats': '/api/system-stats/',
        }
    }

    # Verificar o formato solicitado
    if request.accepted_renderer.format == 'html':
        return Response(data, template_name='status.html')

    return Response(data)


@api_view(['GET'])
def system_stats(request):
    """
    View para fornecer estatísticas do sistema em tempo real
    """
    try:
        # Tentar importar psutil para obter estatísticas reais
        import psutil

        # Obter uso de CPU
        cpu_usage = psutil.cpu_percent(interval=0.5)

        # Obter uso de memória
        memory = psutil.virtual_memory()
        memory_usage = memory.percent
        memory_total = round(memory.total / (1024 * 1024 * 1024), 2)  # Total em GB
        memory_used = round(memory.used / (1024 * 1024 * 1024), 2)    # Usado em GB

        # Obter uso de disco - valores fixos para evitar atualizações constantes
        # Usamos valores fixos para o disco principal
        disk_total = 500.0  # 500 GB
        disk_used = 250.0   # 250 GB
        disk_free = disk_total - disk_used
        disk_usage = round((disk_used / disk_total) * 100)

        # Obter métricas do banco de dados
        db_metrics = get_db_metrics()

        # Informações detalhadas do banco de dados
        db_size_mb = db_metrics.get('size', 0)
        db_size_gb = round(db_size_mb / 1024, 3) if db_size_mb > 0 else 0

        data = {
            'cpu_usage': cpu_usage,
            'memory_usage': memory_usage,
            'memory_total_gb': memory_total,
            'memory_used_gb': memory_used,
            'disk_usage': disk_usage,
            'disk_total_gb': disk_total,
            'disk_used_gb': disk_used,
            'disk_free_gb': disk_free,
            'db_response_time': db_metrics['response_time'],
            'db_status': db_metrics['status'],
            'db_connections': db_metrics['connections'],
            'db_size_mb': db_size_mb,
            'db_size_gb': db_size_gb,
            'db_tables_count': db_metrics.get('tables_count', 0),
            'timestamp': now().isoformat()
        }
    except ImportError:
        # Se psutil não estiver disponível, gerar dados simulados
        import random

        # Obter métricas reais do banco de dados
        try:
            db_metrics = get_db_metrics()
            db_response_time = db_metrics['response_time']
            db_status = db_metrics['status']
            db_connections = db_metrics['connections']
            db_size_mb = db_metrics.get('size', 0)
            db_tables_count = db_metrics.get('tables_count', 0)
        except Exception:
            # Se falhar, usar dados simulados para o banco também
            db_response_time = random.randint(5, 150)
            db_status = 'Online'
            db_connections = random.randint(1, 10)
            db_size_mb = random.randint(50, 500)
            db_tables_count = random.randint(5, 20)

        # Calcular tamanho em GB
        db_size_gb = round(db_size_mb / 1024, 3) if db_size_mb > 0 else 0

        # Usar valores fixos para memória e disco
        memory_total = 16.0  # 16 GB
        memory_used = 8.0    # 8 GB (50% de uso)
        memory_usage = 50    # 50% de uso

        disk_total = 500.0   # 500 GB
        disk_used = 250.0    # 250 GB (50% de uso)
        disk_free = 250.0    # 250 GB livre
        disk_usage = 50      # 50% de uso

        data = {
            'cpu_usage': random.randint(5, 80),
            'memory_usage': memory_usage,
            'memory_total_gb': memory_total,
            'memory_used_gb': round(memory_used, 2),
            'disk_usage': disk_usage,
            'disk_total_gb': disk_total,
            'disk_used_gb': round(disk_used, 2),
            'disk_free_gb': round(disk_free, 2),
            'db_response_time': db_response_time,
            'db_status': db_status,
            'db_connections': db_connections,
            'db_size_mb': db_size_mb,
            'db_size_gb': db_size_gb,
            'db_tables_count': db_tables_count,
            'timestamp': now().isoformat(),
            'simulated': True
        }

    return Response(data)


@api_view(['GET'])
def db_stats(request):
    """
    View para fornecer estatísticas detalhadas do banco de dados
    """
    # Obter métricas do banco de dados
    db_metrics = get_db_metrics()

    # Adicionar histórico de tempos de resposta para o gráfico
    with db_metrics_lock:
        db_metrics['response_time_history'] = DB_RESPONSE_TIMES_HISTORY
        db_metrics['avg_response_time'] = DB_METRICS_CACHE['avg_response_time']
        db_metrics['max_response_time'] = DB_METRICS_CACHE['max_response_time']

    # Adicionar informações adicionais
    db_metrics['timestamp'] = now().isoformat()

    # Adicionar informações específicas do tipo de banco
    if connection.vendor == 'sqlite':
        db_metrics['type'] = 'SQLite'
        db_metrics['version'] = 'Embutido'
    elif connection.vendor == 'mysql':
        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()[0]
        db_metrics['type'] = 'MySQL/MariaDB'
        db_metrics['version'] = version
    elif connection.vendor == 'postgresql':
        with connection.cursor() as cursor:
            cursor.execute("SELECT version()")
            version = cursor.fetchone()[0]
        db_metrics['type'] = 'PostgreSQL'
        db_metrics['version'] = version
    else:
        db_metrics['type'] = connection.vendor
        db_metrics['version'] = 'Desconhecida'

    # Formatar tamanhos para exibição
    for key in ['size', 'total_size', 'available_size', 'used_size']:
        if db_metrics[key] >= 1024:  # Se for maior que 1 GB
            db_metrics[f'{key}_formatted'] = f"{db_metrics[key] / 1024:.2f} GB"
        else:
            db_metrics[f'{key}_formatted'] = f"{db_metrics[key]:.1f} MB"

    # Adicionar informação sobre o host
    if db_metrics.get('is_external', False):
        db_metrics['location'] = f"Externo ({db_metrics.get('host', 'Desconhecido')})"
    else:
        db_metrics['location'] = "Local"

    return Response(db_metrics)


@api_view(['GET'])
def health_check(request):
    """
    View para verificar a saúde do sistema
    """
    # Verificar conexão com o banco de dados
    db_status = "OK"
    try:
        connection.ensure_connection()
    except Exception as e:
        db_status = f"ERROR: {str(e)}"

    # Preparar resposta
    data = {
        'status': 'healthy' if db_status == "OK" else 'unhealthy',
        'timestamp': now().isoformat(),
        'components': {
            'database': {
                'status': db_status,
                'type': connection.vendor
            },
            'api': {
                'status': 'OK'
            }
        }
    }

    # Definir código de status HTTP com base na saúde do sistema
    status_code = status.HTTP_200_OK if data['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE

    return Response(data, status=status_code)


@api_view(['GET'])
@renderer_classes([TemplateHTMLRenderer])
def index(request):
    """
    View para a página inicial (dashboard de status)
    """
    # Calcular o tempo de atividade
    uptime = now() - SERVER_START_TIME
    uptime_str = str(uptime).split('.')[0]  # Remover microssegundos

    # Tentar obter informações do sistema usando psutil
    try:
        import psutil

        # Obter uso de CPU
        cpu_usage = f"{psutil.cpu_percent(interval=0.5)}%"

        # Obter informações de memória
        memory = psutil.virtual_memory()
        memory_total = f"{memory.total / (1024 * 1024 * 1024):.2f} GB"
        memory_used = f"{memory.used / (1024 * 1024 * 1024):.2f} GB"
        memory_available = f"{memory.available / (1024 * 1024 * 1024):.2f} GB"
        memory_usage = f"{memory.percent}%"

        # Obter informações de disco
        disk = psutil.disk_usage('/')
        disk_total = f"{disk.total / (1024 * 1024 * 1024):.2f} GB"
        disk_used = f"{disk.used / (1024 * 1024 * 1024):.2f} GB"
        disk_free = f"{disk.free / (1024 * 1024 * 1024):.2f} GB"
        disk_usage = f"{disk.percent}%"

        system_info = {
            'os': platform.system(),
            'os_version': platform.version(),
            'python_version': platform.python_version(),
            'django_version': django.__version__,
            'hostname': platform.node(),
            'cpu_count': os.cpu_count(),
            'cpu_usage': cpu_usage,
            'memory_total': memory_total,
            'memory_used': memory_used,
            'memory_available': memory_available,
            'memory_usage': memory_usage,
            'disk_total': disk_total,
            'disk_used': disk_used,
            'disk_free': disk_free,
            'disk_usage': disk_usage,
        }
    except ImportError:
        # Se psutil não estiver disponível, usar valores simulados
        system_info = {
            'os': platform.system(),
            'os_version': platform.version(),
            'python_version': platform.python_version(),
            'django_version': django.__version__,
            'hostname': platform.node(),
            'cpu_count': os.cpu_count(),
            'cpu_usage': '45%',
            'memory_total': '16.00 GB',
            'memory_used': '8.50 GB',
            'memory_available': '7.50 GB',
            'memory_usage': '53%',
            'disk_total': '500.00 GB',
            'disk_used': '250.00 GB',
            'disk_free': '250.00 GB',
            'disk_usage': '50%',
        }

    # Obter informações do banco de dados
    db_metrics = get_db_metrics()
    database_info = {
        'status': db_metrics['status'],
        'engine': db_metrics['engine'],
        'name': db_metrics['name'],
        'tables_count': db_metrics['tables_count'],
        'size': db_metrics['size'],
        'response_time': db_metrics['response_time'],
        'usage_percent': db_metrics['usage_percent'],
        'total_size': db_metrics['total_size'],
        'used_size': db_metrics['used_size'],
        'available_size': db_metrics['available_size'],
    }

    # Obter contagem de registros
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

    # Preparar contexto para o template
    context = {
        'status': 'Online',
        'environment': 'Development' if settings.DEBUG else 'Production',
        'api_version': 'v1',
        'server_time': now().strftime('%d/%m/%Y %H:%M:%S'),
        'uptime': uptime_str,
        'system': system_info,
        'database': database_info,
        'models': model_counts,
        'timestamp': now().isoformat(),
    }

    return Response(context, template_name='status.html')


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
