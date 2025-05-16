"""
Inicialização dos serviços para o app de livros
"""

from core.services.book_service import book_service

# Exportar o serviço para uso no app
__all__ = ['book_service']
