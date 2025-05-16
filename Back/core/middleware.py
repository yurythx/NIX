"""
Middleware personalizado para o projeto.
"""
import traceback
import logging
import json
from django.http import JsonResponse
from rest_framework import status
from django.conf import settings

# Configurar logger
logger = logging.getLogger(__name__)

class ExceptionMiddleware:
    """
    Middleware para tratar exceções não capturadas e padronizar respostas de erro.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)

            # Padronizar respostas de erro HTTP
            if 400 <= response.status_code < 600 and hasattr(response, 'content'):
                try:
                    # Tentar decodificar o conteúdo como JSON
                    content = json.loads(response.content.decode('utf-8'))

                    # Se o conteúdo já estiver no formato padrão, retornar como está
                    if 'error' in content and 'detail' in content:
                        return response

                    # Padronizar a resposta
                    error_message = content.get('detail', 'Erro desconhecido')
                    if isinstance(error_message, dict):
                        # Lidar com erros de validação
                        detail = {}
                        for field, errors in error_message.items():
                            if isinstance(errors, list):
                                detail[field] = errors[0] if errors else 'Erro de validação'
                            else:
                                detail[field] = errors
                    else:
                        detail = error_message

                    # Criar resposta padronizada
                    standardized_content = {
                        'error': self._get_error_title(response.status_code),
                        'detail': detail,
                        'status_code': response.status_code
                    }

                    # Substituir o conteúdo da resposta
                    response.content = json.dumps(standardized_content).encode('utf-8')
                    response['Content-Type'] = 'application/json'
                except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
                    # Se não for JSON ou não puder ser decodificado, deixar como está
                    pass

            return response
        except Exception as e:
            # Log detalhado do erro para depuração
            logger.error(f"Erro não tratado: {str(e)}")
            logger.error(traceback.format_exc())

            # Em ambiente de desenvolvimento, incluir detalhes do erro
            if settings.DEBUG:
                error_detail = {
                    'message': str(e),
                    'traceback': traceback.format_exc().split('\n')
                }
            else:
                error_detail = "Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde."

            # Retornar uma resposta de erro padronizada
            return JsonResponse({
                'error': 'Erro Interno do Servidor',
                'detail': error_detail,
                'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _get_error_title(self, status_code):
        """
        Retorna um título amigável para o código de status HTTP.
        """
        error_titles = {
            400: 'Requisição Inválida',
            401: 'Não Autorizado',
            403: 'Acesso Proibido',
            404: 'Não Encontrado',
            405: 'Método Não Permitido',
            406: 'Não Aceitável',
            408: 'Tempo de Requisição Esgotado',
            409: 'Conflito',
            410: 'Recurso Removido',
            413: 'Payload Muito Grande',
            415: 'Tipo de Mídia Não Suportado',
            422: 'Entidade Não Processável',
            429: 'Muitas Requisições',
            500: 'Erro Interno do Servidor',
            501: 'Não Implementado',
            502: 'Gateway Inválido',
            503: 'Serviço Indisponível',
            504: 'Tempo de Gateway Esgotado'
        }

        return error_titles.get(status_code, f'Erro {status_code}')
