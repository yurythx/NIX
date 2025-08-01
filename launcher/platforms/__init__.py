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


def get_available_platforms(config: Optional[Dict[str, Any]] = None) -> List[PlatformHandler]:
    """Retorna uma lista de plataformas disponíveis no sistema.
    
    Args:
        config: Dicionário de configuração opcional. Se não fornecido, será usado um vazio.
    """
    from .steam import SteamHandler
    from .local_games import LocalGamesHandler
    from .emulators import EmulatorHandler
    
    available = []
    config = config or {}
    
    # Verifica e adiciona Steam se disponível
    try:
        steam = SteamHandler()
        if steam.is_available():
            available.append(steam)
    except Exception as e:
        print(f"Erro ao carregar Steam: {e}")
    
    # Sempre adiciona suporte a jogos locais
    try:
        local = LocalGamesHandler()
        available.append(local)
    except Exception as e:
        print(f"Erro ao carregar jogos locais: {e}")
    
    # Adiciona suporte a emuladores se configurado
    try:
        emulators = EmulatorHandler(config)
        if emulators.is_available():
            available.append(emulators)
    except Exception as e:
        print(f"Erro ao carregar emuladores: {e}")
    
    return available
