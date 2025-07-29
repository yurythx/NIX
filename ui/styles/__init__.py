""
Pacote de estilos para o NIX Launcher.

Este pacote contém os arquivos de estilo QSS usados para estilizar a interface do usuário.
"""

from pathlib import Path

# Caminho para o diretório de estilos
STYLES_DIR = Path(__file__).parent

# Caminhos para os arquivos de tema
try:
    DARK_THEME = (STYLES_DIR / 'dark.qss').resolve()
    LIGHT_THEME = (STYLES_DIR / 'light.qss').resolve()
    SYSTEM_THEME = (STYLES_DIR / 'system.qss').resolve()
except Exception as e:
    import logging
    logging.error(f"Erro ao carregar temas: {e}")
    DARK_THEME = LIGHT_THEME = SYSTEM_THEME = None

__all__ = ['DARK_THEME', 'LIGHT_THEME', 'SYSTEM_THEME']
