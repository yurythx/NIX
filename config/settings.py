"""
Módulo de configuração centralizada para o NIX Launcher.
"""

import json
from pathlib import Path
from typing import Any, Dict

# Diretórios base
BASE_DIR = Path(__file__).parent.parent
CONFIG_DIR = Path.home() / '.nix_launcher'
CONFIG_DIR.mkdir(exist_ok=True)

# Caminhos de arquivos
SETTINGS_FILE = CONFIG_DIR / 'settings.json'

# Configurações padrão
# Temas disponíveis
THEMES = {
    "dark": {
        "name": "Escuro",
        "file": "dark.qss"
    },
    "light": {
        "name": "Claro",
        "file": "light.qss"
    },
    "system": {
        "name": "Sistema",
        "file": "system.qss"
    }
}

# Configurações padrão
DEFAULT_SETTINGS = {
    "ui": {
        "theme": "dark",
        "font_size": 12,
        "fullscreen": False,
        "window_width": 1280,
        "window_height": 800,
        "window_maximized": False,
        "show_fps": False,
        "animation_enabled": True,
        "animation_duration": 200  # ms
    },
    "game": {
        "default_install_dir": str(Path.home() / 'Games'),
        "sort_by": "name",  # name, last_played, playtime
        "sort_ascending": True,
        "show_hidden": False,
        "auto_update": True,
        "update_interval": 3600  # segundos
    },
    "input": {
        "gamepad_enabled": True,
        "gamepad_deadzone": 0.2,
        "key_repeat_delay": 0.3,
        "key_repeat_interval": 0.1,
        "shortcuts": {
            "toggle_fullscreen": "F11",
            "toggle_debug": "F12",
            "navigate_up": "Up",
            "navigate_down": "Down",
            "navigate_left": "Left",
            "navigate_right": "Right",
            "select": "Return",
            "back": "Escape",
            "menu": "Menu"
        }
    },
    "advanced": {
        "log_level": "INFO",  # DEBUG, INFO, WARNING, ERROR, CRITICAL
        "enable_analytics": True,
        "send_crash_reports": True,
        "check_for_updates": True,
        "start_minimized": False
    }
}

class Settings:
    """Classe singleton para gerenciar configurações."""
    _instance = None
    _settings: Dict[str, Any] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Settings, cls).__new__(cls)
            cls._instance._load_settings()
        return cls._instance
    
    def _load_settings(self) -> None:
        """Carrega as configurações do arquivo ou usa valores padrão."""
        try:
            if SETTINGS_FILE.exists():
                with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                    self._settings = {**DEFAULT_SETTINGS, **json.load(f)}
            else:
                self._settings = DEFAULT_SETTINGS.copy()
                self._save_settings()
        except Exception:
            self._settings = DEFAULT_SETTINGS.copy()
    
    def _save_settings(self) -> None:
        """Salva as configurações no arquivo."""
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(self._settings, f, indent=4, ensure_ascii=False)
    
    def get(self, key: str, default: Any = None) -> Any:
        """Obtém um valor de configuração."""
        keys = key.split('.')
        value = self._settings
        try:
            for k in keys:
                value = value[k]
            return value
        except (KeyError, TypeError):
            return default
    
    def set(self, key: str, value: Any) -> None:
        """
        Define um valor de configuração.
        
        Args:
            key: Chave da configuração no formato 'secao.chave'
            value: Valor a ser definido
            
        Raises:
            ValueError: Se o valor for inválido para a chave especificada
        """
        # Validações específicas
        if key == 'ui.theme' and value not in THEMES:
            raise ValueError(f"Tema inválido. Opções disponíveis: {', '.join(THEMES.keys())}")
            
        if key == 'ui.font_size' and (not isinstance(value, int) or value < 8 or value > 24):
            raise ValueError("Tamanho da fonte deve ser um inteiro entre 8 e 24")
            
        if key == 'input.gamepad_deadzone' and (value < 0 or value > 1):
            raise ValueError("Zona morta do gamepad deve estar entre 0 e 1")
        
        # Atualiza o valor
        keys = key.split('.')
        settings = self._settings
        
        for k in keys[:-1]:
            if k not in settings:
                settings[k] = {}
            settings = settings[k]
        
        settings[keys[-1]] = value
        self._save_settings()
        
        # Notifica observadores sobre a mudança
        self.notify_observers(key, value)
    
    def get_theme_path(self, theme_name: str = None) -> Path:
        """
        Obtém o caminho para o arquivo de tema.
        
        Args:
            theme_name: Nome do tema. Se None, usa o tema atual.
            
        Returns:
            Path: Caminho para o arquivo de tema
        """
        if theme_name is None:
            theme_name = self.get('ui.theme', 'dark')
            
        theme = THEMES.get(theme_name, THEMES['dark'])
        return BASE_DIR / 'ui' / 'styles' / theme['file']
    
    # Observers pattern para notificar sobre mudanças
    _observers = []
    
    def add_observer(self, callback):
        """
        Adiciona um observador para ser notificado sobre mudanças nas configurações.
        
        Args:
            callback: Função que será chamada quando uma configuração mudar.
                     A assinatura deve ser: callback(key: str, value: Any) -> None
        """
        if callback not in self._observers:
            self._observers.append(callback)
    
    def remove_observer(self, callback):
        """Remove um observador."""
        if callback in self._observers:
            self._observers.remove(callback)
    
    def notify_observers(self, key: str, value: Any) -> None:
        """Notifica todos os observadores sobre uma mudança."""
        for callback in self._observers[:]:
            try:
                callback(key, value)
            except Exception as e:
                import logging
                logging.error(f"Erro ao notificar observador: {e}")
    
    def reset_to_defaults(self) -> None:
        """Reseta todas as configurações para os valores padrão."""
        self._settings = {**DEFAULT_SETTINGS}
        self._save_settings()
        
        # Notifica sobre todas as mudanças
        for section, values in DEFAULT_SETTINGS.items():
            if isinstance(values, dict):
                for key, value in values.items():
                    self.notify_observers(f"{section}.{key}", value)

# Instância global
settings = Settings()
