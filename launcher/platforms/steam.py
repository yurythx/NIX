"""
Módulo para integração com a plataforma Steam.

Este módulo fornece uma implementação da interface PlatformHandler para a plataforma Steam,
permitindo a descoberta e execução de jogos da Steam no NIX Launcher.
"""

import os
import json
import vdf
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from . import PlatformHandler, Game

logger = logging.getLogger(__name__)

@dataclass
class SteamGame(Game):
    """Classe que representa um jogo da Steam."""
    appid: str
    name: str
    install_dir: Path
    executable: str = ""
    platform: str = "steam"
    icon: Optional[str] = None
    banner: Optional[str] = None
    is_installed: bool = True
    last_played: Optional[float] = None
    playtime: float = 0.0
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        """Configurações adicionais após a inicialização."""
        if self.metadata is None:
            self.metadata = {}
        
        # Configura a URL da capa do jogo
        if not self.banner and self.appid:
            self.banner = f"http://media.steampowered.com/steamcommunity/public/images/apps/{self.appid}/header.jpg"
        
        # Se não houver executável definido, tenta encontrar um no diretório de instalação
        if not self.executable and self.install_dir:
            # Tenta encontrar o executável principal
            executaveis = list(self.install_dir.glob("*.exe"))
            if executaveis:
                self.executable = str(executaveis[0].name)


class SteamHandler(PlatformHandler):
    """Manipulador para a plataforma Steam."""
    
    def __init__(self):
        """Inicializa o manipulador da Steam."""
        self._steam_path = self._find_steam_path()
        self._library_folders = self._find_library_folders()
    
    @property
    def name(self) -> str:
        """Retorna o nome da plataforma."""
        return "Steam"
    
    def is_available(self) -> bool:
        """Verifica se o cliente Steam está instalado e acessível."""
        return self._steam_path is not None and self._steam_path.exists()
    
    def get_games(self) -> List[Game]:
        """
        Retorna a lista de jogos da Steam instalados no sistema.
        
        Returns:
            Lista de objetos Game representando os jogos da Steam
        """
        if not self.is_available():
            logger.warning("Steam não está disponível no sistema")
            return []
        
        games = []
        
        # Para cada pasta de biblioteca da Steam
        for lib_path in self._library_folders:
            steamapps_path = lib_path / "steamapps"
            if not steamapps_path.exists():
                continue
                
            # Encontra todos os manifestos de jogos
            manifest_files = list(steamapps_path.glob("appmanifest_*.acf"))
            
            for manifest_file in manifest_files:
                try:
                    game = self._parse_manifest(manifest_file, steamapps_path)
                    if game:
                        games.append(game)
                except Exception as e:
                    logger.error(f"Erro ao processar manifesto {manifest_file}: {e}")
        
        return games
    
    def launch_game(self, game_id: str) -> bool:
        """
        Inicia um jogo da Steam.
        
        Args:
            game_id: ID do jogo (AppID) a ser iniciado
            
        Returns:
            True se o jogo foi iniciado com sucesso, False caso contrário
        """
        import subprocess
        import sys
        
        try:
            if sys.platform == 'win32':
                steam_exe = self._steam_path / "steam.exe"
                subprocess.Popen([str(steam_exe), f"steam://rungameid/{game_id}"])
                return True
            else:
                # Para Linux/Mac, o comando pode variar
                subprocess.Popen(["steam", f"steam://rungameid/{game_id}"])
                return True
        except Exception as e:
            logger.error(f"Erro ao iniciar jogo Steam {game_id}: {e}")
            return False
    
    def _find_steam_path(self) -> Optional[Path]:
        """
        Encontra o caminho de instalação do Steam no sistema.
        
        Returns:
            Path para o diretório de instalação do Steam ou None se não encontrado
        """
        # Verifica os locais comuns de instalação do Steam
        possible_paths = [
            Path(os.path.expandvars(r"%ProgramFiles(x86)%\Steam")),
            Path(os.path.expandvars(r"%ProgramFiles%\Steam")),
            Path.home() / ".steam" / "steam",  # Linux
            Path.home() / "Library" / "Application Support" / "Steam"  # macOS
        ]
        
        for path in possible_paths:
            if path.exists() and (path / "steam.exe" if os.name == 'nt' else path / "steam").exists():
                return path
        
        return None
    
    def _find_library_folders(self) -> List[Path]:
        """
        Encontra todas as pastas de biblioteca da Steam configuradas no sistema.
        
        Returns:
            Lista de Paths para as pastas de biblioteca da Steam
        """
        if not self._steam_path:
            return []
        
        library_folders = [self._steam_path]  # A pasta principal é sempre uma biblioteca
        
        # Tenta encontrar o arquivo libraryfolders.vdf que contém as outras bibliotecas
        library_file = self._steam_path / "steamapps" / "libraryfolders.vdf"
        
        if not library_file.exists():
            return library_folders
        
        try:
            with open(library_file, 'r', encoding='utf-8') as f:
                data = vdf.load(f)
                
            # O formato do arquivo libraryfolders.vdf mudou ao longo do tempo
            if 'libraryfolders' in data:
                # Formato mais recente
                for key, value in data['libraryfolders'].items():
                    if key.isdigit():  # As chaves numéricas são os índices das pastas
                        path = Path(value.get('path', ''))
                        if path.exists():
                            library_folders.append(path)
            else:
                # Formato mais antigo (para compatibilidade)
                for key, value in data.items():
                    if key.isdigit():  # As chaves numéricas são os índices das pastas
                        path = Path(value.get('path', ''))
                        if path.exists():
                            library_folders.append(path)
        except Exception as e:
            logger.error(f"Erro ao ler arquivo de bibliotecas da Steam: {e}")
        
        return library_folders
    
    def _parse_manifest(self, manifest_path: Path, steamapps_path: Path) -> Optional[SteamGame]:
        """
        Analisa um arquivo de manifesto de jogo da Steam.
        
        Args:
            manifest_path: Caminho para o arquivo de manifesto
            steamapps_path: Caminho para o diretório steamapps
            
        Returns:
            Objeto SteamGame ou None se o jogo não for válido
        """
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest = vdf.load(f)
                
            if 'AppState' not in manifest:
                return None
                
            app_state = manifest['AppState']
            appid = app_state.get('appid')
            name = app_state.get('name')
            
            if not appid or not name:
                return None
            
            # Obtém o diretório de instalação do jogo
            installdir = app_state.get('installdir', '')
            install_path = steamapps_path / 'common' / installdir
            
            # Cria o objeto do jogo
            game = SteamGame(
                appid=str(appid),
                name=name,
                install_dir=install_path,
                executable=app_state.get('executable', ''),
                last_played=float(app_state.get('LastUpdated', 0)),
                playtime=float(app_state.get('PlaytimeForever', 0)) / 60.0,  # Converter minutos para horas
                metadata={
                    'developer': app_state.get('developer', ''),
                    'publisher': app_state.get('publisher', ''),
                    'release_date': app_state.get('releasestate', ''),
                    'size_on_disk': int(app_state.get('SizeOnDisk', 0)),
                    'state_flags': int(app_state.get('StateFlags', 0)),
                }
            )
            
            return game
            
        except Exception as e:
            logger.error(f"Erro ao processar manifesto {manifest_path}: {e}")
            return None
