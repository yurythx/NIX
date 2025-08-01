"""
Módulo para gerenciar a configuração de emuladores no NIX Launcher.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class EmulatorConfig:
    """Classe para gerenciar a configuração de emuladores."""
    
    def __init__(self, config_file: Optional[str] = None):
        """Inicializa o gerenciador de configuração de emuladores.
        
        Args:
            config_file: Caminho para o arquivo de configuração de emuladores.
                        Se None, tenta carregar do local padrão.
        """
        self.config_file = Path(config_file) if config_file else self._get_default_config_path()
        self.config: Dict[str, Any] = self._load_config()
    
    def _get_default_config_path(self) -> Path:
        """Retorna o caminho padrão para o arquivo de configuração de emuladores."""
        config_dir = Path.home() / '.nix_launcher'
        config_dir.mkdir(exist_ok=True)
        return config_dir / 'emulators.json'
    
    def _load_config(self) -> Dict[str, Any]:
        """Carrega a configuração de emuladores do arquivo."""
        try:
            if self.config_file.exists():
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Erro ao carregar configuração de emuladores: {e}")
        
        # Retorna uma configuração padrão se o arquivo não existir ou houver erro
        return {
            "emulators": [],
            "rom_directories": []
        }
    
    def save_config(self) -> bool:
        """Salva a configuração de emuladores no arquivo."""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar configuração de emuladores: {e}")
            return False
    
    def get_emulators(self) -> List[Dict[str, Any]]:
        """Retorna a lista de emuladores configurados."""
        return self.config.get("emulators", [])
    
    def get_rom_directories(self) -> List[str]:
        """Retorna a lista de diretórios de ROMs configurados."""
        return self.config.get("rom_directories", [])
    
    def add_emulator(self, emulator: Dict[str, Any]) -> bool:
        """Adiciona um novo emulador à configuração."""
        if "name" not in emulator or "path" not in emulator:
            logger.error("Nome e caminho são obrigatórios para adicionar um emulador")
            return False
            
        # Verifica se o emulador já existe
        for idx, existing in enumerate(self.config.get("emulators", [])):
            if existing.get("name") == emulator["name"]:
                # Atualiza o emulador existente
                self.config["emulators"][idx] = emulator
                return self.save_config()
        
        # Adiciona o novo emulador
        if "emulators" not in self.config:
            self.config["emulators"] = []
        
        self.config["emulators"].append(emulator)
        return self.save_config()
    
    def remove_emulator(self, emulator_name: str) -> bool:
        """Remove um emulador da configuração."""
        if "emulators" not in self.config:
            return False
            
        initial_length = len(self.config["emulators"])
        self.config["emulators"] = [
            e for e in self.config["emulators"] 
            if e.get("name") != emulator_name
        ]
        
        if len(self.config["emulators"]) < initial_length:
            return self.save_config()
        return False
    
    def add_rom_directory(self, directory: str) -> bool:
        """Adiciona um diretório de ROMs à configuração."""
        if "rom_directories" not in self.config:
            self.config["rom_directories"] = []
            
        if directory not in self.config["rom_directories"]:
            self.config["rom_directories"].append(directory)
            return self.save_config()
        return True
    
    def remove_rom_directory(self, directory: str) -> bool:
        """Remove um diretório de ROMs da configuração."""
        if "rom_directories" not in self.config:
            return False
            
        initial_length = len(self.config["rom_directories"])
        self.config["rom_directories"] = [
            d for d in self.config["rom_directories"] 
            if d != directory
        ]
        
        if len(self.config["rom_directories"]) < initial_length:
            return self.save_config()
        return False

# Instância global
emulator_config = EmulatorConfig()
