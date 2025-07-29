"""
Módulo para gerenciar jogos locais não-Steam.

Este módulo fornece uma implementação da interface PlatformHandler para jogos instalados
localmente no sistema, fora de plataformas como Steam, Epic, etc.
"""

import os
import logging
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from . import PlatformHandler, Game

logger = logging.getLogger(__name__)

@dataclass
class LocalGame(Game):
    """Classe que representa um jogo local."""
    id: str
    name: str
    install_dir: Path
    executable: str
    platform: str = "local"
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
        
        # Se o caminho do executável for relativo, torna-o absoluto em relação ao diretório de instalação
        if self.executable and not os.path.isabs(self.executable):
            self.executable = str(self.install_dir / self.executable)


class LocalGamesHandler(PlatformHandler):
    """Manipulador para jogos locais."""
    
    def __init__(self):
        """Inicializa o manipulador de jogos locais."""
        self._config_file = Path.home() / ".config" / "nix_launcher" / "local_games.json"
        self._games: Dict[str, LocalGame] = {}
        self._scan_directories: List[Path] = []
        self._load_config()
    
    @property
    def name(self) -> str:
        """Retorna o nome da plataforma."""
        return "Jogos Locais"
    
    def is_available(self) -> bool:
        """Sempre disponível, pois lida com jogos locais."""
        return True
    
    def get_games(self) -> List[Game]:
        """
        Retorna a lista de jogos locais configurados.
        
        Returns:
            Lista de objetos Game representando os jogos locais
        """
        # Carrega os jogos do arquivo de configuração
        self._load_config()
        
        # Retorna apenas os jogos que ainda existem no sistema
        valid_games = []
        for game in self._games.values():
            game_path = Path(game.install_dir) / game.executable
            if game_path.exists():
                valid_games.append(game)
            else:
                logger.warning(f"Jogo não encontrado: {game.name} em {game_path}")
        
        return valid_games
    
    def launch_game(self, game_id: str) -> bool:
        """
        Inicia um jogo local.
        
        Args:
            game_id: ID do jogo a ser iniciado
            
        Returns:
            True se o jogo foi iniciado com sucesso, False caso contrário
        """
        import subprocess
        import sys
        
        if game_id not in self._games:
            logger.error(f"Jogo com ID {game_id} não encontrado")
            return False
        
        game = self._games[game_id]
        game_path = Path(game.install_dir) / game.executable
        
        if not game_path.exists():
            logger.error(f"Arquivo do jogo não encontrado: {game_path}")
            return False
        
        try:
            if sys.platform == 'win32':
                # No Windows, use startfile para abrir o executável
                os.startfile(str(game_path))
            else:
                # No Linux/Mac, use subprocess
                subprocess.Popen([str(game_path)])
            
            # Atualiza o horário da última execução
            import time
            game.last_played = time.time()
            self._save_config()
            
            return True
        except Exception as e:
            logger.error(f"Erro ao iniciar jogo {game_id}: {e}")
            return False
    
    def add_game(self, name: str, install_dir: str, executable: str, **metadata) -> Optional[LocalGame]:
        """
        Adiciona um novo jogo local à biblioteca.
        
        Args:
            name: Nome do jogo
            install_dir: Diretório de instalação do jogo
            executable: Nome do arquivo executável (pode ser relativo ao diretório de instalação)
            **metadata: Metadados adicionais do jogo
            
        Returns:
            O objeto LocalGame criado ou None em caso de erro
        """
        # Gera um ID único para o jogo
        import uuid
        game_id = f"local_{uuid.uuid4().hex}"
        
        # Cria o objeto do jogo
        game = LocalGame(
            id=game_id,
            name=name,
            install_dir=Path(install_dir),
            executable=executable,
            metadata=metadata
        )
        
        # Adiciona à lista de jogos
        self._games[game_id] = game
        
        # Salva a configuração
        if self._save_config():
            return game
        
        return None
    
    def remove_game(self, game_id: str) -> bool:
        """
        Remove um jogo da biblioteca.
        
        Args:
            game_id: ID do jogo a ser removido
            
        Returns:
            True se o jogo foi removido com sucesso, False caso contrário
        """
        if game_id in self._games:
            del self._games[game_id]
            return self._save_config()
        
        return False
    
    def add_scan_directory(self, directory: str) -> bool:
        """
        Adiciona um diretório para escanear em busca de jogos.
        
        Args:
            directory: Caminho do diretório a ser escaneado
            
        Returns:
            True se o diretório foi adicionado com sucesso, False caso contrário
        """
        dir_path = Path(directory)
        if dir_path.exists() and dir_path.is_dir() and dir_path not in self._scan_directories:
            self._scan_directories.append(dir_path)
            return self._save_config()
        
        return False
    
    def scan_for_games(self) -> List[LocalGame]:
        """
        Escaneia os diretórios configurados em busca de jogos.
        
        Returns:
            Lista de jogos encontrados
        """
        found_games = []
        
        for directory in self._scan_directories:
            for root, _, files in os.walk(directory):
                for file in files:
                    if file.lower().endswith(('.exe', '.lnk')):
                        # Verifica se o arquivo parece ser um jogo (pode ser aprimorado)
                        if self._looks_like_game(file):
                            game_name = os.path.splitext(file)[0]
                            game_id = f"local_auto_{os.path.basename(root).lower().replace(' ', '_')}"
                            
                            # Cria o jogo se ainda não existir
                            if game_id not in self._games:
                                game = LocalGame(
                                    id=game_id,
                                    name=game_name,
                                    install_dir=Path(root),
                                    executable=file,
                                    metadata={"auto_detected": True}
                                )
                                self._games[game_id] = game
                                found_games.append(game)
        
        # Salva os jogos encontrados
        if found_games:
            self._save_config()
        
        return found_games
    
    def _load_config(self) -> bool:
        """
        Carrega a configuração de jogos locais do arquivo.
        
        Returns:
            True se a configuração foi carregada com sucesso, False caso contrário
        """
        try:
            if not self._config_file.exists():
                return False
            
            with open(self._config_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Carrega os jogos
            self._games.clear()
            for game_id, game_data in data.get('games', {}).items():
                try:
                    game = LocalGame(
                        id=game_id,
                        name=game_data['name'],
                        install_dir=Path(game_data['install_dir']),
                        executable=game_data['executable'],
                        platform=game_data.get('platform', 'local'),
                        icon=game_data.get('icon'),
                        banner=game_data.get('banner'),
                        is_installed=game_data.get('is_installed', True),
                        last_played=game_data.get('last_played'),
                        playtime=game_data.get('playtime', 0.0),
                        metadata=game_data.get('metadata', {})
                    )
                    self._games[game_id] = game
                except Exception as e:
                    logger.error(f"Erro ao carregar jogo {game_id}: {e}")
            
            # Carrega os diretórios para escanear
            self._scan_directories = [Path(d) for d in data.get('scan_directories', [])]
            
            return True
        except Exception as e:
            logger.error(f"Erro ao carregar configuração de jogos locais: {e}")
            return False
    
    def _save_config(self) -> bool:
        """
        Salva a configuração de jogos locais no arquivo.
        
        Returns:
            True se a configuração foi salva com sucesso, False caso contrário
        """
        try:
            # Cria o diretório de configuração se não existir
            self._config_file.parent.mkdir(parents=True, exist_ok=True)
            
            # Prepara os dados para salvar
            data = {
                'version': 1,
                'games': {},
                'scan_directories': [str(d) for d in self._scan_directories]
            }
            
            # Converte os jogos para dicionário
            for game_id, game in self._games.items():
                data['games'][game_id] = {
                    'name': game.name,
                    'install_dir': str(game.install_dir),
                    'executable': game.executable,
                    'platform': game.platform,
                    'icon': game.icon,
                    'banner': game.banner,
                    'is_installed': game.is_installed,
                    'last_played': game.last_played,
                    'playtime': game.playtime,
                    'metadata': game.metadata or {}
                }
            
            # Salva no arquivo
            with open(self._config_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar configuração de jogos locais: {e}")
            return False
    
    @staticmethod
    def _looks_like_game(filename: str) -> bool:
        """
        Verifica se um arquivo parece ser um jogo com base no nome.
        
        Args:
            filename: Nome do arquivo a ser verificado
            
        Returns:
            True se o arquivo parece ser um jogo, False caso contrário
        """
        # Lista de palavras-chave que indicam que o arquivo pode ser um jogo
        game_keywords = [
            'launcher', 'game', 'setup', 'install', 'play', 'start', 'run',
            'battle', 'war', 'quest', 'adventure', 'legend', 'kingdom', 'empire',
            'simulator', 'tycoon', 'edition', 'definitive', 'remastered', 'hd'
        ]
        
        # Lista de palavras que indicam que o arquivo provavelmente não é um jogo
        non_game_keywords = [
            'unins', 'uninst', 'uninstall', 'crash', 'error', 'dxsetup', 'vcredist',
            'directx', 'redist', 'msi', 'msp', 'patch', 'update', 'eula', 'readme',
            'license', 'changelog', 'config', 'settings', 'options', 'credits', 'help'
        ]
        
        # Converte para minúsculas para comparação sem distinção de maiúsculas/minúsculas
        filename_lower = filename.lower()
        
        # Verifica se o nome do arquivo contém alguma palavra-chave de jogo
        has_game_keyword = any(keyword in filename_lower for keyword in game_keywords)
        
        # Verifica se o nome do arquivo contém alguma palavra-chave de não-jogo
        has_non_game_keyword = any(keyword in filename_lower for keyword in non_game_keywords)
        
        # Considera como jogo se tiver uma palavra-chave de jogo e nenhuma de não-jogo
        return has_game_keyword and not has_non_game_keyword
