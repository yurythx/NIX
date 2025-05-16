"""
Views para o core do projeto
"""

from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.http import JsonResponse


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
        'message': 'Bem-vindo à API do Viixen'
    })
