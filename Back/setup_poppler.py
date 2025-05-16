"""
Script para baixar e configurar o Poppler no Windows.
Este script baixa o Poppler, extrai para a pasta do projeto e configura o caminho.
"""

import os
import sys
import zipfile
import shutil
import logging
import tempfile
import argparse
import subprocess
from pathlib import Path

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# URL do Poppler para Windows (versões disponíveis)
POPPLER_VERSIONS = {
    "23.08.0": "https://github.com/oschwartz10612/poppler-windows/releases/download/v23.08.0-0/Release-23.08.0-0.zip",
    "23.05.0": "https://github.com/oschwartz10612/poppler-windows/releases/download/v23.05.0-0/Release-23.05.0-0.zip",
    "22.12.0": "https://github.com/oschwartz10612/poppler-windows/releases/download/v22.12.0-0/Release-22.12.0-0.zip",
    "22.04.0": "https://github.com/oschwartz10612/poppler-windows/releases/download/v22.04.0-0/Release-22.04.0-0.zip",
    "21.11.0": "https://github.com/oschwartz10612/poppler-windows/releases/download/v21.11.0-0/Release-21.11.0-0.zip",
}

# Diretório do projeto
PROJECT_DIR = Path(__file__).resolve().parent
POPPLER_DIR = PROJECT_DIR / "poppler"

def download_file(url, target_file):
    """Baixa um arquivo da internet."""
    import requests

    logger.info(f"Baixando {url}...")

    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))
        block_size = 1024  # 1 Kibibyte
        downloaded = 0

        with open(target_file, 'wb') as f:
            for data in response.iter_content(block_size):
                f.write(data)
                downloaded += len(data)
                # Mostrar progresso
                if total_size > 0:
                    progress = int(50 * downloaded / total_size)
                    sys.stdout.write("\r[%s%s] %d%%" % ('=' * progress, ' ' * (50 - progress), 2 * progress))
                    sys.stdout.flush()

        sys.stdout.write('\n')
        logger.info(f"Download concluído: {target_file}")
        return True
    except Exception as e:
        logger.error(f"Erro ao baixar arquivo: {str(e)}")
        return False

def extract_zip(zip_file, target_dir):
    """Extrai um arquivo ZIP."""
    logger.info(f"Extraindo {zip_file} para {target_dir}...")

    try:
        with zipfile.ZipFile(zip_file, 'r') as zip_ref:
            zip_ref.extractall(target_dir)

        logger.info(f"Extração concluída")
        return True
    except Exception as e:
        logger.error(f"Erro ao extrair arquivo: {str(e)}")
        return False

def detect_poppler():
    """Detecta se o Poppler já está instalado no sistema."""
    try:
        # Verificar se o Poppler está no PATH
        if sys.platform.startswith('win'):
            # No Windows, procurar pdftoppm.exe
            result = subprocess.run(['where', 'pdftoppm'], capture_output=True, text=True)
            if result.returncode == 0:
                poppler_path = os.path.dirname(result.stdout.strip())
                logger.info(f"Poppler encontrado no PATH: {poppler_path}")
                return poppler_path
            
            # Verificar diretórios comuns
            common_dirs = [
                os.path.join(os.environ.get('PROGRAMFILES', 'C:\\Program Files'), 'poppler', 'bin'),
                os.path.join(os.environ.get('PROGRAMFILES(X86)', 'C:\\Program Files (x86)'), 'poppler', 'bin'),
                os.path.join(os.environ.get('LOCALAPPDATA', 'C:\\Users\\' + os.getlogin() + '\\AppData\\Local'), 'poppler', 'bin'),
                str(POPPLER_DIR / 'bin')
            ]
            
            for directory in common_dirs:
                if os.path.exists(os.path.join(directory, 'pdftoppm.exe')):
                    logger.info(f"Poppler encontrado em: {directory}")
                    return directory
        else:
            # No Linux/Mac, verificar se pdftoppm está instalado
            result = subprocess.run(['which', 'pdftoppm'], capture_output=True, text=True)
            if result.returncode == 0:
                poppler_path = os.path.dirname(result.stdout.strip())
                logger.info(f"Poppler encontrado no PATH: {poppler_path}")
                return poppler_path
        
        logger.info("Poppler não encontrado no sistema.")
        return None
    except Exception as e:
        logger.error(f"Erro ao detectar Poppler: {str(e)}")
        return None

def setup_poppler(version="23.08.0", force=False):
    """Configura o Poppler no Windows."""
    if not sys.platform.startswith('win'):
        logger.info("Este script é apenas para Windows. No Linux, instale o poppler-utils com apt-get.")
        logger.info("  sudo apt-get install poppler-utils")
        return
    
    # Verificar se o Poppler já está instalado
    poppler_path = detect_poppler()
    if poppler_path and not force:
        logger.info(f"Poppler já está instalado em: {poppler_path}")
        logger.info("Use a opção --force para reinstalar.")
        
        # Atualizar o arquivo .env
        update_env_file(poppler_path)
        return poppler_path
    
    # Verificar se a versão solicitada existe
    if version not in POPPLER_VERSIONS:
        logger.error(f"Versão {version} não disponível. Versões disponíveis: {', '.join(POPPLER_VERSIONS.keys())}")
        return None
    
    poppler_url = POPPLER_VERSIONS[version]
    
    # Criar diretório temporário
    with tempfile.TemporaryDirectory() as temp_dir:
        # Baixar o Poppler
        zip_file = os.path.join(temp_dir, "poppler.zip")
        if not download_file(poppler_url, zip_file):
            return None

        # Extrair o arquivo
        extract_dir = os.path.join(temp_dir, "extract")
        os.makedirs(extract_dir, exist_ok=True)

        if not extract_zip(zip_file, extract_dir):
            return None

        # Encontrar o diretório extraído
        poppler_extracted = None
        for item in os.listdir(extract_dir):
            item_path = os.path.join(extract_dir, item)
            if os.path.isdir(item_path) and "poppler" in item.lower():
                poppler_extracted = item_path
                break
            
            # Verificar se os arquivos estão diretamente no diretório de extração
            if os.path.isdir(os.path.join(item_path, "bin")):
                poppler_extracted = item_path
                break

        if not poppler_extracted:
            # Verificar se os arquivos estão diretamente no diretório de extração
            if os.path.isdir(os.path.join(extract_dir, "bin")):
                poppler_extracted = extract_dir
            else:
                logger.error("Não foi possível encontrar o diretório do Poppler no arquivo extraído")
                return None

        # Limpar diretório de destino se existir
        if os.path.exists(POPPLER_DIR) and force:
            logger.info(f"Removendo diretório existente: {POPPLER_DIR}")
            shutil.rmtree(POPPLER_DIR, ignore_errors=True)

        # Criar diretório de destino
        os.makedirs(POPPLER_DIR, exist_ok=True)

        # Copiar arquivos
        logger.info(f"Copiando arquivos para {POPPLER_DIR}...")

        try:
            # Copiar todo o conteúdo
            for item in os.listdir(poppler_extracted):
                src = os.path.join(poppler_extracted, item)
                dst = os.path.join(POPPLER_DIR, item)

                if os.path.isdir(src):
                    if os.path.exists(dst):
                        shutil.rmtree(dst, ignore_errors=True)
                    shutil.copytree(src, dst)
                else:
                    shutil.copy2(src, dst)

            logger.info("Poppler configurado com sucesso!")
            poppler_bin_path = str(POPPLER_DIR / "bin")
            logger.info(f"Caminho do Poppler: {poppler_bin_path}")

            # Atualizar o arquivo .env
            update_env_file(poppler_bin_path)
            
            return poppler_bin_path

        except Exception as e:
            logger.error(f"Erro ao configurar Poppler: {str(e)}")
            return None

def update_env_file(poppler_path):
    """Atualiza o arquivo .env com o caminho do Poppler."""
    env_file = PROJECT_DIR / ".env"
    poppler_path = str(poppler_path).replace("\\", "\\\\")

    env_content = f"POPPLER_PATH={poppler_path}\n"

    try:
        if os.path.exists(env_file):
            # Ler o arquivo existente
            with open(env_file, 'r') as f:
                lines = f.readlines()

            # Verificar se já existe uma configuração para POPPLER_PATH
            poppler_line_index = None
            for i, line in enumerate(lines):
                if line.startswith("POPPLER_PATH="):
                    poppler_line_index = i
                    break

            if poppler_line_index is not None:
                # Substituir a linha existente
                lines[poppler_line_index] = env_content
            else:
                # Adicionar nova linha
                lines.append(env_content)

            # Escrever o arquivo atualizado
            with open(env_file, 'w') as f:
                f.writelines(lines)
        else:
            # Criar novo arquivo
            with open(env_file, 'w') as f:
                f.write(env_content)

        logger.info(f"Configuração adicionada ao arquivo .env: {env_file}")
        return True
    except Exception as e:
        logger.error(f"Erro ao atualizar arquivo .env: {str(e)}")
        return False

def test_poppler(poppler_path):
    """Testa se o Poppler está funcionando corretamente."""
    if not poppler_path:
        logger.error("Caminho do Poppler não fornecido.")
        return False
    
    try:
        # Verificar se o executável pdftoppm existe
        pdftoppm_path = os.path.join(poppler_path, "pdftoppm.exe" if sys.platform.startswith('win') else "pdftoppm")
        if not os.path.exists(pdftoppm_path):
            logger.error(f"Executável pdftoppm não encontrado em: {pdftoppm_path}")
            return False
        
        # Testar o comando pdftoppm
        result = subprocess.run([pdftoppm_path, "-v"], capture_output=True, text=True)
        if result.returncode != 0:
            logger.error(f"Erro ao executar pdftoppm: {result.stderr}")
            return False
        
        logger.info(f"Poppler testado com sucesso: {result.stdout.strip()}")
        return True
    except Exception as e:
        logger.error(f"Erro ao testar Poppler: {str(e)}")
        return False

def main():
    """Função principal."""
    parser = argparse.ArgumentParser(description="Configurar o Poppler para conversão de PDF para imagem")
    parser.add_argument("--version", choices=POPPLER_VERSIONS.keys(), default="23.08.0", help="Versão do Poppler a ser instalada")
    parser.add_argument("--force", action="store_true", help="Forçar reinstalação mesmo se o Poppler já estiver instalado")
    parser.add_argument("--test", action="store_true", help="Testar se o Poppler está funcionando corretamente")
    
    args = parser.parse_args()
    
    if args.test:
        poppler_path = detect_poppler()
        if poppler_path:
            test_poppler(poppler_path)
        else:
            logger.error("Poppler não encontrado. Instale-o primeiro.")
    else:
        poppler_path = setup_poppler(args.version, args.force)
        if poppler_path and args.test:
            test_poppler(poppler_path)

if __name__ == "__main__":
    main()
