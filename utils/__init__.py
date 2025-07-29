"""
Pacote de utilitários para o NIX Launcher.

Este pacote contém módulos de utilidades compartilhadas por toda a aplicação,
como configuração de logging, manipulação de arquivos, gerenciamento de temas, entre outros.
"""

from .logging_config import setup_logging, get_logger
from .theme_manager import ThemeManager, theme_manager

__all__ = [
    'setup_logging', 
    'get_logger',
    'ThemeManager',
    'theme_manager'
]
