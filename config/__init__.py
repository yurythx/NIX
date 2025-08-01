"""
Pacote de configuração para o NIX Launcher.

Este pacote contém as configurações e preferências do usuário,
além de utilitários para gerenciamento de configurações.
"""

from .settings import settings, Settings
from .emulator_config import emulator_config, EmulatorConfig

__all__ = [
    'settings', 
    'Settings',
    'emulator_config',
    'EmulatorConfig'
]
