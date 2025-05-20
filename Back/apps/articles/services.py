"""
Inicialização dos serviços para o app articles
"""

from core.services.article_service import article_service

# Exportar os serviços para uso nas views
__all__ = ['article_service']
