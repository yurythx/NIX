"""
Middleware para monitoramento de performance
"""

import time
import logging
from django.utils.deprecation import MiddlewareMixin

# Configurar logger
logger = logging.getLogger('performance')


class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """
    Middleware para monitorar o tempo de resposta das requisições
    """
    
    def process_request(self, request):
        """
        Registra o tempo de início da requisição
        """
        request.start_time = time.time()
    
    def process_response(self, request, response):
        """
        Calcula e registra o tempo total da requisição
        """
        # Verificar se o tempo de início foi registrado
        if hasattr(request, 'start_time'):
            # Calcular o tempo total
            total_time = time.time() - request.start_time
            
            # Registrar no log se o tempo for maior que 1 segundo
            if total_time > 1:
                logger.warning(
                    f"Requisição lenta: {request.method} {request.path} - {total_time:.2f}s"
                )
            
            # Adicionar o tempo de resposta ao cabeçalho
            response['X-Response-Time'] = f"{total_time:.2f}s"
        
        return response
