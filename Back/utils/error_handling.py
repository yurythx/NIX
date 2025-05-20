from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import RequestDataTooBig, SuspiciousFileOperation
from django.http import Http404
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Manipulador de exceções personalizado para a API.
    Lida com exceções específicas e retorna respostas apropriadas.
    """
    # Primeiro, chama o manipulador de exceções padrão do DRF
    response = exception_handler(exc, context)

    # Se o DRF já tratou a exceção, retorna a resposta
    if response is not None:
        return response

    # Loga a exceção para depuração
    logger.error(f"Exceção não tratada: {exc}")
    
    # Trata exceções específicas
    if isinstance(exc, RequestDataTooBig):
        # Exceção para quando o tamanho do upload excede o limite
        return Response({
            'detail': 'O arquivo enviado é muito grande. O tamanho máximo permitido é 100MB.',
            'code': 'file_too_large'
        }, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
    
    elif isinstance(exc, SuspiciousFileOperation):
        # Exceção para operações suspeitas com arquivos
        return Response({
            'detail': 'Operação de arquivo suspeita ou inválida.',
            'code': 'invalid_file_operation'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    elif isinstance(exc, Http404):
        # Exceção para recursos não encontrados
        return Response({
            'detail': 'O recurso solicitado não foi encontrado.',
            'code': 'not_found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Para outras exceções não tratadas, retorna um erro 500
    return Response({
        'detail': 'Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde.',
        'code': 'internal_server_error'
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
