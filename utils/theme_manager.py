"""
Gerenciador de temas para o NIX Launcher.

Este módulo fornece funcionalidades para carregar e gerenciar temas de interface
do usuário, incluindo detecção de preferências do sistema operacional.
"""

import os
import platform
import logging
from pathlib import Path
from typing import Optional, Dict, Any, Union

from PyQt5.QtCore import QFile, QTextStream, QSettings, Qt
from PyQt5.QtGui import QPalette, QColor, QGuiApplication

from config import settings

logger = logging.getLogger(__name__)

class ThemeManager:
    """Gerencia temas e estilos da interface do usuário."""
    
    # Mapeamento de temas disponíveis
    THEMES = {
        'dark': {
            'name': 'Escuro',
            'file': 'dark.qss',
            'is_dark': True
        },
        'light': {
            'name': 'Claro',
            'file': 'light.qss',
            'is_dark': False
        },
        'system': {
            'name': 'Sistema',
            'file': 'system.qss',
            'is_dark': None  # Será determinado em tempo de execução
        }
    }
    
    _instance = None
    _current_theme = None
    _style_sheet = ""
    
    def __new__(cls):
        """Implementa o padrão Singleton."""
        if cls._instance is None:
            cls._instance = super(ThemeManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Inicializa o gerenciador de temas."""
        if self._initialized:
            return
            
        self._initialized = True
        self._styles_dir = Path(__file__).parent.parent / 'ui' / 'styles'
        self._current_theme = settings.get('ui.theme', 'dark')
        
        # Carrega o tema atual
        self.load_theme(self._current_theme)
        
        # Registra para receber notificações de mudança de tema
        settings.add_observer(self._on_setting_changed)
    
    def _on_setting_changed(self, key: str, value: Any) -> None:
        """Lida com mudanças nas configurações."""
        if key == 'ui.theme' and value != self._current_theme:
            self.load_theme(value)
    
    @property
    def current_theme(self) -> str:
        """Retorna o tema atual."""
        return self._current_theme
    
    @property
    def is_dark_theme(self) -> bool:
        """Retorna True se o tema atual for escuro."""
        if self._current_theme == 'system':
            return self._is_system_dark_theme()
        return self.THEMES[self._current_theme]['is_dark']
    
    def _is_system_dark_theme(self) -> bool:
        """
        Detecta se o sistema operacional está usando um tema escuro.
        
        Returns:
            bool: True se o sistema estiver usando um tema escuro, False caso contrário.
        """
        try:
            system = platform.system().lower()
            
            # Windows
            if system == 'windows':
                try:
                    import winreg
                    with winreg.OpenKey(
                        winreg.HKEY_CURRENT_USER,
                        r'Software\Microsoft\Windows\CurrentVersion\Themes\Personalize'
                    ) as key:
                        value = winreg.QueryValueEx(key, 'AppsUseLightTheme')[0]
                        return value == 0
                except (WindowsError, ImportError):
                    pass
            
            # macOS
            elif system == 'darwin':
                try:
                    from Foundation import NSUserDefaults
                    style = NSUserDefaults.standardUserDefaults().stringForKey_('AppleInterfaceStyle')
                    return style == 'Dark'
                except ImportError:
                    pass
            
            # Linux (GNOME, KDE, etc.)
            elif system == 'linux':
                # Tenta detectar o tema do GNOME
                try:
                    import subprocess
                    result = subprocess.run(
                        ['gsettings', 'get', 'org.gnome.desktop.interface', 'gtk-theme'],
                        capture_output=True,
                        text=True
                    )
                    if result.returncode == 0:
                        theme = result.stdout.strip().lower()
                        return 'dark' in theme
                except (FileNotFoundError, subprocess.SubprocessError):
                    pass
                
                # Tenta detectar o tema do KDE
                try:
                    import configparser
                    kde_globals = Path.home() / '.config' / 'kdeglobals'
                    if kde_globals.exists():
                        config = configparser.ConfigParser()
                        config.read(kde_globals)
                        if 'KDE' in config and 'ColorScheme' in config['KDE']:
                            return 'dark' in config['KDE']['ColorScheme'].lower()
                except Exception:
                    pass
            
        except Exception as e:
            logger.warning(f"Falha ao detectar tema do sistema: {e}")
        
        # Padrão: tema claro
        return False
    
    def load_theme(self, theme_name: str) -> bool:
        """
        Carrega um tema pelo nome.
        
        Args:
            theme_name: Nome do tema a ser carregado ('dark', 'light' ou 'system').
            
        Returns:
            bool: True se o tema foi carregado com sucesso, False caso contrário.
        """
        if theme_name not in self.THEMES:
            logger.warning(f"Tema desconhecido: {theme_name}. Usando tema padrão.")
            theme_name = 'dark'
        
        logger.info(f"Carregando tema: {theme_name}")
        self._current_theme = theme_name
        
        # Se for o tema do sistema, determina qual tema carregar
        if theme_name == 'system':
            is_dark = self._is_system_dark_theme()
            theme_name = 'dark' if is_dark else 'light'
            logger.info(f"Tema do sistema detectado: {'escuro' if is_dark else 'claro'}")
        
        # Carrega o arquivo de estilo
        theme_file = self._styles_dir / self.THEMES[theme_name]['file']
        
        try:
            with open(theme_file, 'r', encoding='utf-8') as f:
                self._style_sheet = f.read()
            
            logger.debug(f"Tema {theme_name} carregado com sucesso de {theme_file}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao carregar o tema {theme_name} de {theme_file}: {e}")
            # Tenta carregar o tema padrão em caso de erro
            if theme_name != 'dark':
                return self.load_theme('dark')
            return False
    
    def apply_theme(self, app) -> None:
        """
        Aplica o tema atual a um aplicativo Qt.
        
        Args:
            app: Instância de QApplication ou QMainWindow.
        """
        if hasattr(app, 'setStyleSheet'):
            app.setStyleSheet(self._style_sheet)
        
        # Ajusta a paleta de cores para temas escuros/claros
        palette = app.palette()
        
        if self.is_dark_theme:
            # Configurações para tema escuro
            palette.setColor(palette.Window, QColor(30, 30, 30))
            palette.setColor(palette.WindowText, QColor(255, 255, 255))
            palette.setColor(palette.Base, QColor(25, 25, 25))
            palette.setColor(palette.AlternateBase, QColor(45, 45, 45))
            palette.setColor(palette.ToolTipBase, QColor(45, 45, 45))
            palette.setColor(palette.ToolTipText, QColor(255, 255, 255))
            palette.setColor(palette.Text, QColor(255, 255, 255))
            palette.setColor(palette.Button, QColor(45, 45, 45))
            palette.setColor(palette.ButtonText, QColor(255, 255, 255))
            palette.setColor(palette.BrightText, QColor(255, 0, 0))
            palette.setColor(palette.Highlight, QColor(42, 130, 218))
            palette.setColor(palette.HighlightedText, QColor(255, 255, 255))
            palette.setColor(palette.Link, QColor(42, 130, 218))
            palette.setColor(palette.LinkVisited, QColor(127, 0, 255))
        else:
            # Configurações para tema claro
            palette.setColor(palette.Window, QColor(240, 240, 240))
            palette.setColor(palette.WindowText, QColor(0, 0, 0))
            palette.setColor(palette.Base, QColor(255, 255, 255))
            palette.setColor(palette.AlternateBase, QColor(240, 240, 240))
            palette.setColor(palette.ToolTipBase, QColor(255, 255, 255))
            palette.setColor(palette.ToolTipText, QColor(0, 0, 0))
            palette.setColor(palette.Text, QColor(0, 0, 0))
            palette.setColor(palette.Button, QColor(240, 240, 240))
            palette.setColor(palette.ButtonText, QColor(0, 0, 0))
            palette.setColor(palette.BrightText, QColor(255, 0, 0))
            palette.setColor(palette.Highlight, QColor(66, 165, 245))
            palette.setColor(palette.HighlightedText, QColor(255, 255, 255))
            palette.setColor(palette.Link, QColor(41, 121, 255))
            palette.setColor(palette.LinkVisited, QColor(98, 0, 234))
        
        app.setPalette(palette)
        
        # Aplica estilos específicos para diferentes sistemas operacionais
        self._apply_platform_specific_styles(app)
    
    def _apply_platform_specific_styles(self, app) -> None:
        """Aplica estilos específicos para diferentes sistemas operacionais."""
        system = platform.system().lower()
        
        # Estilos específicos para Windows
        if system == 'windows':
            app.setStyle('Fusion')
        
        # Estilos específicos para macOS
        elif system == 'darwin':
            app.setStyle('macos')
        
        # Estilos específicos para Linux
        elif system == 'linux':
            app.setStyle('Fusion')
    
    def get_available_themes(self) -> Dict[str, Dict[str, Any]]:
        """
        Retorna um dicionário com os temas disponíveis.
        
        Returns:
            Dict[str, Dict[str, Any]]: Dicionário com os temas disponíveis.
        """
        return self.THEMES.copy()

# Instância global para acesso fácil
theme_manager = ThemeManager()
