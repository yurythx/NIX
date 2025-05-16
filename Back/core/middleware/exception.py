"""
Middleware para tratar exceções
"""

import logging
import json
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework import status

# Configurar logger
logger = logging.getLogger('django')


class ExceptionMiddleware(MiddlewareMixin):
    """
    Middleware para tratar exceções e padronizar respostas de erro
    """
    
    def process_exception(self, request, exception):
        """
        Processa exceções e retorna uma resposta JSON padronizada
        """
        # Registrar a exceção no log
        logger.error(f"Exceção não tratada: {str(exception)}", exc_info=True)
        
        # Determinar o código de status HTTP
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        
        # Determinar a mensagem de erro
        error_message = "Erro interno do servidor"
        
        # Criar resposta padronizada
        response_data = {
            "error": "Erro Interno",
            "detail": error_message,
            "status_code": status_code
        }
        
        # Retornar resposta JSON
        return JsonResponse(response_data, status=status_code)
