"""
Configurações de caminhos para o Poppler
"""

# Configurações para conversão de PDF
PDF_CACHE_DIR = os.path.join(MEDIA_ROOT, 'pdf_cache')

# Detectar o Poppler automaticamente
POPPLER_PATH = os.environ.get('POPPLER_PATH', None)  # Caminho para o Poppler no Windows

# Se o Poppler não estiver configurado, tentar detectar automaticamente
if not POPPLER_PATH and os.name == 'nt':
    # Verificar diretórios comuns
    common_dirs = [
        os.path.join(BASE_DIR, 'poppler', 'bin'),
        os.path.join(BASE_DIR, 'apps', 'mangas', 'poppler', 'bin'),
        os.path.join(os.environ.get('PROGRAMFILES', r'C:\Program Files'), 'poppler', 'bin'),
        os.path.join(os.environ.get('PROGRAMFILES(X86)', r'C:\Program Files (x86)'), 'poppler', 'bin'),
        os.path.join(os.environ.get('LOCALAPPDATA', os.path.join(r'C:\Users', os.getlogin(), r'AppData\Local')), 'poppler', 'bin'),
    ]
    
    for directory in common_dirs:
        if os.path.exists(os.path.join(directory, 'pdftoppm.exe')):
            POPPLER_PATH = directory
            break
