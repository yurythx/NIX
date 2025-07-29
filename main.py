#!/usr/bin/env python3
"""
NIX Launcher - Um launcher de jogos moderno e personalizável

Este módulo é o ponto de entrada principal do aplicativo NIX Launcher.
"""

import sys
import os
import logging
import argparse
from pathlib import Path

# Importa o logger centralizado
from utils import get_logger, theme_manager
logger = get_logger(__name__)

# Importa as configurações
from config import settings

# Importa a interface gráfica
from PyQt5.QtWidgets import QApplication, QStyleFactory
from PyQt5.QtCore import Qt, QTimer
from PyQt5.QtGui import QIcon

# Importa a janela principal
from ui.main_window import MainWindow

def parse_arguments():
    """Parseia os argumentos de linha de comando."""
    parser = argparse.ArgumentParser(description='NIX Launcher - Um launcher de jogos moderno')
    
    parser.add_argument(
        '--debug',
        action='store_true',
        help='Ativa o modo de depuração (mais logs)'
    )
    
    parser.add_argument(
        '--config',
        type=str,
        default=str(Path.home() / '.config' / 'nix_launcher' / 'config.json'),
        help='Caminho para o arquivo de configuração'
    )
    
    parser.add_argument(
        '--fullscreen',
        action='store_true',
        help='Inicia em modo tela cheia'
    )
    
    parser.add_argument(
        '--theme',
        type=str,
        choices=['dark', 'light', 'system'],
        default='dark',
        help='Tema da interface (dark, light, system)'
    )
    
    return parser.parse_args()

def setup_environment():
    """Configura o ambiente de execução."""
    # Garante que o diretório de configuração existe
    config_dir = Path.home() / '.config' / 'nix_launcher'
    config_dir.mkdir(parents=True, exist_ok=True)
    
    # Configura variáveis de ambiente se necessário
    os.environ['QT_AUTO_SCREEN_SCALE_FACTOR'] = '1'
    os.environ['QT_SCALE_FACTOR'] = '1'
    
    # Configura o caminho para os estilos e ativos
    app_dir = Path(__file__).parent
    styles_dir = app_dir / 'ui' / 'styles'
    assets_dir = app_dir / 'ui' / 'assets'
    
    # Adiciona os diretórios ao PATH se necessário
    if str(styles_dir) not in os.environ.get('QSS_PATH', ''):
        os.environ['QSS_PATH'] = str(styles_dir)
    
    if str(assets_dir) not in os.environ.get('PATH', ''):
        os.environ['PATH'] = f"{str(assets_dir)}{os.pathsep}{os.environ.get('PATH', '')}"

def main():
    """Função principal do aplicativo."""
    try:
        # Parseia argumentos de linha de comando
        args = parse_arguments()
        
        # Configura o nível de log
        if args.debug:
            logging.getLogger().setLevel(logging.DEBUG)
            logger.info("Modo de depuração ativado")
        
        logger.info("Iniciando NIX Launcher...")
        
        # Configura o ambiente
        setup_environment()
        
        # Cria a aplicação
        app = QApplication(sys.argv)
        app.setApplicationName("NIX Launcher")
        app.setApplicationVersion("1.0.0")
        
        # Configurações de alta DPI e escalonamento
        app.setAttribute(Qt.AA_UseHighDpiPixmaps)
        app.setAttribute(Qt.AA_EnableHighDpiScaling, True)
        
        # Define o estilo de janela nativo
        if 'Fusion' in QStyleFactory.keys():
            app.setStyle(QStyleFactory.create('Fusion'))
        
        # Configura o tema
        theme_name = args.theme or settings.get('ui.theme', 'dark')
        if theme_name != theme_manager.current_theme:
            theme_manager.load_theme(theme_name)
        
        # Aplica o tema à aplicação
        theme_manager.apply_theme(app)
        
        # Define o ícone do aplicativo
        app_icon = QIcon(str(Path(__file__).parent / 'ui' / 'assets' / 'icon.svg'))
        if not app_icon.isNull():
            app.setWindowIcon(app_icon)
        
        # Cria e configura a janela principal
        win = MainWindow(
            config_path=args.config,
            fullscreen=args.fullscreen,
            theme=theme_name
        )
        
        # Exibe a janela
        if settings.get('ui.fullscreen', False) or args.fullscreen:
            win.showFullScreen()
        elif settings.get('ui.window_maximized', False):
            win.showMaximized()
        else:
            win.show()
        
        # Executa o loop de eventos
        sys.exit(app.exec_())
        
    except Exception as e:
        logger.critical(f"Erro fatal ao iniciar o NIX Launcher: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
