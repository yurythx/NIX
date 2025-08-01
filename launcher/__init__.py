"""
Pacote principal do NIX Launcher.

Este pacote contém os módulos principais do NIX Launcher, incluindo:
- Gerenciamento de jogos
- Integração com plataformas (Steam, jogos locais, etc.)
- Manipulação de entrada (teclado, mouse, gamepad)
- Cache de imagens
"""

# Importações principais para facilitar o acesso aos módulos
from .game_manager import game_manager, GameManager
from .game import Game
from .platforms import get_available_platforms, PlatformHandler
from .input_handler import InputHandler, GamepadListener
from .image_cache import ImageCache

# Versão do pacote
__version__ = "1.0.0"

# Lista de símbolos exportados quando se usa 'from launcher import *'
__all__ = [
    'game_manager',
    'GameManager',
    'get_available_platforms',
    'PlatformHandler',
    'Game',
    'InputHandler',
    'GamepadListener',
    'ImageCache'
]
