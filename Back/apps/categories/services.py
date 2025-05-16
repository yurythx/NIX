"""
Inicialização dos serviços para o app categories
"""

from core.services.category_service import category_service

# Exportar os serviços para uso nas views
__all__ = ['category_service']
