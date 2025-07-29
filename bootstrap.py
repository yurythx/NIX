#!/usr/bin/env python3
"""
Script de inicialização do NIX Launcher.

Este script é responsável por verificar e instalar dependências,
configurar o ambiente e iniciar o aplicativo principal.
"""

import os
import sys
import subprocess
import platform
import importlib.util
from pathlib import Path
from typing import List, Tuple, Dict, Any

# Configuração de logging básica antes de importar outros módulos
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Dependências necessárias
REQUIRED_PACKAGES = [
    'PyQt5>=5.15.0',
    'inputs>=0.5',
    'pillow>=8.0.0',
    'requests>=2.25.0',
    'vdf>=3.4',  # Para manipulação de arquivos VDF do Steam
    'pywin32>=300; sys_platform == "win32"',  # Apenas para Windows
    'python-xlib>=0.29; sys_platform == "linux"'  # Apenas para Linux
]

# Configurações de ambiente
ENV_VARS = {
    'QT_AUTO_SCREEN_SCALE_FACTOR': '1',
    'QT_SCALE_FACTOR': '1',
    'PYTHONUNBUFFERED': '1'
}

def check_python_version() -> bool:
    """Verifica se a versão do Python é compatível."""
    required = (3, 8)
    current = sys.version_info[:2]
    
    if current < required:
        logger.error(
            "Versão do Python não suportada. Necessário %d.%d+, mas encontrado %d.%d",
            required[0], required[1], current[0], current[1]
        )
        return False
    return True

def check_dependencies() -> Tuple[bool, List[Tuple[str, str, bool]]]:
    """Verifica se todas as dependências necessárias estão instaladas."""
    missing_deps = []
    all_installed = True
    
    for pkg_spec in REQUIRED_PACKAGES:
        # Extrai nome do pacote (remove condicionais e versão)
        pkg_name = pkg_spec.split('>=')[0].split(';')[0].strip()
        
        # Verifica se o pacote está instalado
        spec = importlib.util.find_spec(pkg_name.split('[')[0] if '[' in pkg_name else pkg_name)
        is_installed = spec is not None
        
        if not is_installed:
            all_installed = False
            
        missing_deps.append((pkg_name, pkg_spec, is_installed))
    
    return all_installed, missing_deps

def install_dependencies() -> bool:
    """Instala as dependências necessárias usando pip."""
    try:
        logger.info("Instalando dependências necessárias...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
        
        # Instala as dependências
        for pkg in REQUIRED_PACKAGES:
            subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])
            
        logger.info("Dependências instaladas com sucesso!")
        return True
    except subprocess.CalledProcessError as e:
        logger.error("Erro ao instalar dependências: %s", str(e))
        return False

def setup_environment() -> None:
    """Configura as variáveis de ambiente necessárias."""
    # Configura as variáveis de ambiente
    for key, value in ENV_VARS.items():
        os.environ[key] = value
    
    # Configura o caminho para os estilos
    styles_dir = Path(__file__).parent / 'ui' / 'styles'
    if styles_dir.exists():
        os.environ['QSS_PATH'] = str(styles_dir)
    
    # Configura o caminho para os ícones
    icons_dir = Path(__file__).parent / 'ui' / 'icons'
    if icons_dir.exists():
        os.environ['ICONS_PATH'] = str(icons_dir)

def main() -> int:
    """Função principal de inicialização."""
    try:
        # Verifica a versão do Python
        if not check_python_version():
            return 1
        
        # Verifica e instala dependências
        all_installed, deps_status = check_dependencies()
        
        if not all_installed:
            logger.warning("Algumas dependências não estão instaladas:")
            for pkg, spec, installed in deps_status:
                status = "OK" if installed else "FALTANDO"
                logger.warning("  %-20s %s", f"{pkg}:", status)
            
            if input("Deseja instalar as dependências faltantes? (s/N): ").lower() == 's':
                if not install_dependencies():
                    logger.error("Falha ao instalar as dependências. Abortando...")
                    return 1
            else:
                logger.error("Dependências necessárias não atendidas. Abortando...")
                return 1
        
        # Configura o ambiente
        setup_environment()
        
        # Importa e inicia o aplicativo principal
        from main import main as app_main
        return app_main()
        
    except Exception as e:
        logger.exception("Erro fatal durante a inicialização: %s", str(e))
        return 1

if __name__ == "__main__":
    sys.exit(main())
