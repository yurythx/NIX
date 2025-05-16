"""
Inicialização dos serviços para o app accounts
"""

from core.services.user_service import user_service, user_settings_service

# Exportar os serviços para uso nas views
__all__ = ['user_service', 'user_settings_service']
