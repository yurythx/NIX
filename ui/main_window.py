"""
Módulo principal da janela do NIX Launcher.

Este módulo define a janela principal do aplicativo, que contém a interface do usuário
e gerencia a navegação entre as diferentes visualizações.
"""

import logging
from pathlib import Path
from typing import Optional

from PyQt5.QtWidgets import QMainWindow, QStackedWidget, QMessageBox, QWidget
from PyQt5.QtCore import Qt, QSize
from PyQt5.QtGui import QIcon

from ui.games_view import GamesView
from ui.settings_view import SettingsView  # Será implementado posteriormente
from config import settings

logger = logging.getLogger(__name__)

class MainWindow(QMainWindow):
    """Janela principal do NIX Launcher.
    
    Esta classe gerencia a janela principal do aplicativo, incluindo a barra de título
    personalizada, navegação entre visualizações e configurações de tema.
    """
    
    def __init__(self, config_path: Optional[str] = None, fullscreen: bool = True, theme: str = 'dark'):
        """Inicializa a janela principal.
        
        Args:
            config_path: Caminho para o arquivo de configuração.
            fullscreen: Se True, inicia em tela cheia.
            theme: Tema da interface ('dark', 'light' ou 'system').
        """
        super().__init__()
        
        # Configurações iniciais
        self.config_path = Path(config_path) if config_path else None
        self.fullscreen = fullscreen
        self.theme = theme
        
        # Inicializa a interface do usuário
        self._init_ui()
        
        # Aplica o tema
        self._apply_theme()
        
        # Configura a janela
        self._setup_window()
        
        # Inicializa o gerenciador de jogos
        self._init_game_manager()
    
    def _init_ui(self) -> None:
        """Inicializa os componentes da interface do usuário."""
        # Configura a janela
        self.setWindowTitle("NIX Launcher")
        self.setWindowIcon(QIcon(str(Path(__file__).parent / 'assets' / 'icon.png')))
        
        # Widget central e gerenciador de layout
        self.central_widget = QStackedWidget()
        self.setCentralWidget(self.central_widget)
        
        # Adiciona as visualizações
        self.games_view = GamesView()
        self.settings_view = SettingsView()  # Será implementado posteriormente
        
        self.central_widget.addWidget(self.games_view)
        self.central_widget.addWidget(self.settings_view)
        
        # Navega para a visualização de jogos por padrão
        self.central_widget.setCurrentWidget(self.games_view)
    
    def _setup_window(self) -> None:
        """Configura as propriedades da janela."""
        # Configura o estilo da janela
        self.setWindowFlags(Qt.FramelessWindowHint)
        
        # Configura o tamanho e posição
        if self.fullscreen:
            self.showFullScreen()
        else:
            self.resize(1280, 720)
            self.center()
    
    def center(self) -> None:
        """Centraliza a janela na tela."""
        frame_geometry = self.frameGeometry()
        screen = self.screen().availableGeometry().center()
        frame_geometry.moveCenter(screen)
        self.move(frame_geometry.topLeft())
    
    def _apply_theme(self) -> None:
        """Aplica o tema à interface do usuário usando o ThemeManager."""
        from utils.theme_manager import theme_manager
        
        # Carrega o tema usando o ThemeManager
        theme_name = self.theme.lower()
        if theme_name not in theme_manager.THEMES:
            logger.warning(f"Tema '{theme_name}' não encontrado. Usando tema padrão.")
            theme_name = 'dark'
        
        # Aplica o tema usando o ThemeManager
        theme_manager.load_theme(theme_name)
        theme_manager.apply_theme(self)
        
        # Aplica o tema a todos os widgets filhos
        for widget in self.findChildren(QWidget):
            if hasattr(widget, 'setStyleSheet'):
                widget.setStyleSheet(theme_manager.style_sheet)
        
        # Atualiza o tema das visualizações existentes
        if hasattr(self, 'games_view'):
            self.games_view.setStyleSheet(theme_manager.style_sheet)
        if hasattr(self, 'settings_view'):
            self.settings_view.setStyleSheet(theme_manager.style_sheet)
        
        # Força uma atualização da interface
        self.update()
        logger.info(f"Tema '{theme_name}' aplicado com sucesso.")
    
    def _init_game_manager(self) -> None:
        """Inicializa o gerenciador de jogos."""
        try:
            from launcher.game_manager import game_manager
            if not game_manager.initialize():
                logger.error("Falha ao inicializar o gerenciador de jogos.")
                QMessageBox.critical(
                    self,
                    "Erro de Inicialização",
                    "Não foi possível inicializar o gerenciador de jogos.\n"
                    "Verifique as configurações e tente novamente."
                )
        except Exception as e:
            logger.critical(f"Erro crítico ao inicializar o gerenciador de jogos: {e}", exc_info=True)
            QMessageBox.critical(
                self,
                "Erro Crítico",
                f"Ocorreu um erro crítico ao inicializar o gerenciador de jogos:\n{str(e)}"
            )
    
    def closeEvent(self, event):
        """Evento chamado quando a janela está prestes a ser fechada."""
        # Limpa recursos antes de fechar
        try:
            from launcher.input_handler import gamepad_listener
            if gamepad_listener.is_running():
                gamepad_listener.stop()
        except Exception as e:
            logger.error(f"Erro ao parar o listener de gamepad: {e}")
        
        # Aceita o evento de fechamento
        event.accept()
