"""
Módulo para integração com diferentes plataformas de jogos.

Este pacote contém implementações específicas para cada plataforma de jogos
suportada pelo NIX Launcher, como Steam, jogos locais, emuladores, etc.
"""

from typing import List, Dict, Any, Optional, Protocol
from dataclasses import dataclass
from pathlib import Path


class Game(Protocol):
    """Interface para representar um jogo de qualquer plataforma."""
    id: str
    name: str
    platform: str
    executable: str
    install_dir: Path
    icon: Optional[str] = None
    banner: Optional[str] = None
    is_installed: bool = True
    last_played: Optional[float] = None
    playtime: float = 0.0
    metadata: Dict[str, Any] = None


class PlatformHandler(Protocol):
    """Interface para manipuladores de plataforma de jogos."""
    
    @property
    def name(self) -> str:
        """Retorna o nome da plataforma."""
        ...
    
    def is_available(self) -> bool:
        """Verifica se a plataforma está disponível no sistema."""
        ...
    
    def get_games(self) -> List[Game]:
        """Retorna a lista de jogos da plataforma."""
        ...
    
    def launch_game(self, game_id: str) -> bool:
        """Inicia um jogo da plataforma."""
        ...


def get_available_platforms() -> List[PlatformHandler]:
    """Retorna uma lista de plataformas disponíveis no sistema."""
    from .steam import SteamHandler
    from .local_games import LocalGamesHandler
    
    available = []
    
    # Verifica e adiciona Steam se disponível
    steam = SteamHandler()
    if steam.is_available():
        available.append(steam)
    
    # Sempre adiciona suporte a jogos locais
    local = LocalGamesHandler()
    available.append(local)
    
    return available
