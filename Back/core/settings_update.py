"""
Script para atualizar as configurações do Poppler no settings.py
"""

import os
import sys
import re
import logging
from pathlib import Path

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Diretório do projeto
PROJECT_DIR = Path(__file__).resolve().parent.parent

def update_settings():
    """Atualiza o arquivo settings.py com a detecção automática do Poppler."""
    settings_file = PROJECT_DIR / "core" / "settings.py"
    
    if not os.path.exists(settings_file):
        logger.error(f"Arquivo settings.py não encontrado: {settings_file}")
        return False
    
    try:
        # Ler o arquivo settings.py
        with open(settings_file, 'r') as f:
            content = f.read()
        
        # Padrão para encontrar a seção de configuração do Poppler
        pattern = r"# Configurações para conversão de PDF\s+PDF_CACHE_DIR = os\.path\.join\(MEDIA_ROOT, 'pdf_cache'\)\s+POPPLER_PATH = os\.environ\.get\('POPPLER_PATH', None\)  # Caminho para o Poppler no Windows"
        
        # Nova configuração
        new_config = """# Configurações para conversão de PDF
PDF_CACHE_DIR = os.path.join(MEDIA_ROOT, 'pdf_cache')

# Detectar o Poppler automaticamente
POPPLER_PATH = os.environ.get('POPPLER_PATH', None)  # Caminho para o Poppler no Windows

# Se o Poppler não estiver configurado, tentar detectar automaticamente
if not POPPLER_PATH and os.name == 'nt':
    # Verificar diretórios comuns
    common_dirs = [
        os.path.join(BASE_DIR, 'poppler', 'bin'),
        os.path.join(BASE_DIR, 'apps', 'mangas', 'poppler', 'bin'),
        os.path.join(os.environ.get('PROGRAMFILES', 'C:\\\\Program Files'), 'poppler', 'bin'),
        os.path.join(os.environ.get('PROGRAMFILES(X86)', 'C:\\\\Program Files (x86)'), 'poppler', 'bin'),
        os.path.join(os.environ.get('LOCALAPPDATA', 'C:\\\\Users\\\\' + os.getlogin() + '\\\\AppData\\\\Local'), 'poppler', 'bin'),
    ]
    
    for directory in common_dirs:
        if os.path.exists(os.path.join(directory, 'pdftoppm.exe')):
            POPPLER_PATH = directory
            break"""
        
        # Substituir a configuração antiga pela nova
        if re.search(pattern, content):
            new_content = re.sub(pattern, new_config, content)
            
            # Escrever o arquivo atualizado
            with open(settings_file, 'w') as f:
                f.write(new_content)
            
            logger.info(f"Arquivo settings.py atualizado com sucesso: {settings_file}")
            return True
        else:
            logger.error("Não foi possível encontrar a seção de configuração do Poppler no arquivo settings.py")
            return False
    
    except Exception as e:
        logger.error(f"Erro ao atualizar arquivo settings.py: {str(e)}")
        return False

if __name__ == "__main__":
    update_settings()
