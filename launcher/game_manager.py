"""
Módulo para gerenciar jogos de diferentes plataformas.

Este módulo fornece uma interface unificada para acessar jogos de todas as plataformas
suportadas pelo NIX Launcher.
"""

import logging
import os
from typing import List, Dict, Any, Optional, Callable
from pathlib import Path

from config import emulator_config
from .platforms import get_available_platforms, Game, PlatformHandler

logger = logging.getLogger(__name__)

class GameManager:
    """Gerenciador central de jogos para o NIX Launcher."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Inicializa o gerenciador de jogos.
        
        Args:
            config: Dicionário de configuração para os manipuladores de plataforma.
                   Se None, as configurações serão carregadas automaticamente.
        """
        # Carrega a configuração de emuladores e combina com a configuração fornecida
        emu_config = emulator_config.config
        
        # Se não houver pastas de ROMs configuradas, usa as pastas de jogos locais
        if not emu_config.get("rom_directories") and config and "pastas_hd" in config:
            emu_config["rom_directories"] = config.get("pastas_hd", [])
        
        # Combina as configurações
        self.config = {
            "emulators": emu_config.get("emulators", []),
            "rom_directories": emu_config.get("rom_directories", []),
            "pastas_hd": config.get("pastas_hd", []) if config else []
        }
        
        self.platforms: List[PlatformHandler] = []
        self.games: Dict[str, Game] = {}
        self._game_list_updated_callbacks = []
        self._initialized = False
    
    def initialize(self) -> bool:
        """
        Inicializa o gerenciador de jogos, descobrindo plataformas disponíveis.
        
        Returns:
            True se a inicialização foi bem-sucedida, False caso contrário
        """
        if self._initialized:
            return True
            
        logger.info("Inicializando gerenciador de jogos...")
        
        try:
            # Descobre plataformas disponíveis
            self.platforms = get_available_platforms(self.config)
            logger.info(f"Plataformas encontradas: {[p.name for p in self.platforms]}")
            
            # Carrega os jogos
            self.refresh_games()
            
            self._initialized = True
            return True
            
        except Exception as e:
            logger.error(f"Erro ao inicializar o gerenciador de jogos: {e}", exc_info=True)
            return False
    
    def refresh_games(self) -> bool:
        """
        Atualiza a lista de jogos de todas as plataformas.
        
        Returns:
            True se a atualização foi bem-sucedida, False caso contrário
        """
        if not self._initialized:
            if not self.initialize():
                return False
        
        try:
            logger.info("Atualizando lista de jogos...")
            new_games = {}
            
            # Obtém jogos de todas as plataformas
            for platform in self.platforms:
                try:
                    platform_name = platform.name
                    logger.info(f"Buscando jogos da plataforma: {platform_name}")
                    
                    # Obtém os jogos da plataforma
                    platform_games = platform.get_games()
                    logger.info(f"Encontrados {len(platform_games)} jogos em {platform_name}")
                    
                    # Adiciona os jogos ao dicionário, usando uma chave única (plataforma_id + jogo_id)
                    for game in platform_games:
                        game_id = f"{platform_name.lower()}_{game.id}"
                        new_games[game_id] = game
                        
                except Exception as e:
                    logger.error(f"Erro ao buscar jogos da plataforma {platform_name}: {e}", exc_info=True)
            
            # Atualiza a lista de jogos
            self.games = new_games
            logger.info(f"Total de jogos carregados: {len(self.games)}")
            
            # Notifica os ouvintes sobre a atualização
            self._notify_game_list_updated()
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao atualizar lista de jogos: {e}", exc_info=True)
            return False
    
    def get_all_games(self) -> List[Game]:
        """
        Retorna todos os jogos disponíveis.
        
        Returns:
            Lista de todos os jogos
        """
        return list(self.games.values())
    
    def get_game(self, game_id: str) -> Optional[Game]:
        """Obtém um jogo pelo ID.
        
        Args:
            game_id: ID do jogo a ser obtido.
            
        Returns:
            O jogo correspondente ao ID ou None se não encontrado.
        """
        return self.games.get(game_id)
        
    def get_games(self) -> List[Game]:
        """Obtém a lista de todos os jogos carregados.
        
        Returns:
            Lista de jogos carregados.
        """
        return list(self.games.values())
    
    def launch_game(self, game_id: str) -> bool:
        """
        Inicia um jogo.
        
        Args:
            game_id: ID do jogo a ser iniciado
            
        Returns:
            True se o jogo foi iniciado com sucesso, False caso contrário
        """
        game = self.get_game_by_id(game_id)
        if not game:
            logger.error(f"Jogo não encontrado: {game_id}")
            return False
        
        logger.info(f"Iniciando jogo: {game.name} (ID: {game_id})")
        
        # Encontra a plataforma correspondente
        platform_name = game.platform.lower()
        platform = next((p for p in self.platforms if p.name.lower() == platform_name), None)
        
        if not platform:
            logger.error(f"Plataforma não encontrada para o jogo {game_id}: {platform_name}")
            return False
        
        # Tenta iniciar o jogo
        try:
            success = platform.launch_game(game.id)
            if success:
                logger.info(f"Jogo iniciado com sucesso: {game.name}")
                # Atualiza o horário da última execução
                import time
                game.last_played = time.time()
                # TODO: Atualizar o jogo na lista
            else:
                logger.error(f"Falha ao iniciar o jogo: {game.name}")
            
            return success
            
        except Exception as e:
            logger.error(f"Erro ao iniciar o jogo {game_id}: {e}", exc_info=True)
            return False
    
    def add_game_list_updated_callback(self, callback: Callable[[List[Game]], None]) -> None:
        """
        Adiciona um callback para ser chamado quando a lista de jogos for atualizada.
        
        Args:
            callback: Função a ser chamada com a nova lista de jogos
        """
        if callback not in self._game_list_updated_callbacks:
            self._game_list_updated_callbacks.append(callback)
    
    def remove_game_list_updated_callback(self, callback: Callable[[List[Game]], None]) -> None:
        """
        Remove um callback de atualização de lista de jogos.
        
        Args:
            callback: Função a ser removida
        """
        if callback in self._game_list_updated_callbacks:
            self._game_list_updated_callbacks.remove(callback)
    
    def _notify_game_list_updated(self) -> None:
        """Notifica todos os ouvintes sobre a atualização da lista de jogos."""
        games_list = self.get_all_games()
        for callback in self._game_list_updated_callbacks:
            try:
                callback(games_list)
            except Exception as e:
                logger.error(f"Erro ao notificar atualização de lista de jogos: {e}", exc_info=True)


# Instância global do gerenciador de jogos
game_manager = GameManager()
