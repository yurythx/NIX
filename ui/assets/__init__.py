""
Pacote de ativos para o NIX Launcher.

Este pacote contém recursos como ícones, imagens e outros arquivos de mídia
usados na interface do usuário do NIX Launcher.
"""

from pathlib import Path

# Caminho para o diretório de ativos
ASSETS_DIR = Path(__file__).parent

# Caminhos para os arquivos de recursos
ICON_SVG = ASSETS_DIR / 'icon.svg'

__all__ = ['ASSETS_DIR', 'ICON_SVG']
