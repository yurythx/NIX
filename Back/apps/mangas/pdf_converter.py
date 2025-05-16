import os
import sys
import logging
import tempfile
from pathlib import Path
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import io
import time
import hashlib

# Configurar o caminho para o Poppler no Windows
POPPLER_PATH = None
if sys.platform.startswith('win'):
    # Verificar se o caminho do Poppler está definido nas configurações
    POPPLER_PATH = getattr(settings, 'POPPLER_PATH', None)

    # Se não estiver definido, tentar alguns caminhos comuns
    if not POPPLER_PATH:
        common_paths = [
            r'C:\poppler\bin',
            r'C:\Program Files\poppler\bin',
            r'C:\Program Files (x86)\poppler\bin',
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'poppler', 'bin')
        ]

        for path in common_paths:
            if os.path.exists(path):
                POPPLER_PATH = path
                break

    if POPPLER_PATH:
        logging.info(f"Usando Poppler em: {POPPLER_PATH}")
    else:
        logging.warning("Poppler não encontrado. A conversão de PDF para imagem pode falhar.")

# Importar pdf2image após configurar o Poppler
try:
    from pdf2image import convert_from_path, convert_from_bytes
    from PIL import Image
    logging.info("pdf2image importado com sucesso")
except ImportError as e:
    logging.error(f"Erro ao importar pdf2image: {str(e)}")
    # Criar funções de fallback para evitar erros de importação
    def convert_from_path(*args, **kwargs):
        raise ImportError("pdf2image não está instalado. Instale com: pip install pdf2image")

    def convert_from_bytes(*args, **kwargs):
        raise ImportError("pdf2image não está instalado. Instale com: pip install pdf2image")

logger = logging.getLogger(__name__)

# Configurações
DPI = 200  # Resolução das imagens (dots per inch)
OUTPUT_FORMAT = 'JPEG'  # Formato de saída (JPEG, PNG)
JPEG_QUALITY = 85  # Qualidade JPEG (1-100)
CACHE_DIR = getattr(settings, 'PDF_CACHE_DIR', os.path.join(settings.MEDIA_ROOT, 'pdf_cache'))

# Criar diretório de cache se não existir
os.makedirs(CACHE_DIR, exist_ok=True)

# Registrar configurações
logger.info(f"Configurações de conversão de PDF:")
logger.info(f"- DPI: {DPI}")
logger.info(f"- Formato: {OUTPUT_FORMAT}")
logger.info(f"- Qualidade JPEG: {JPEG_QUALITY}")
logger.info(f"- Diretório de cache: {CACHE_DIR}")
logger.info(f"- Poppler path: {POPPLER_PATH}")

def get_cache_key(pdf_path, page_number, dpi=DPI, format=OUTPUT_FORMAT, quality=JPEG_QUALITY):
    """Gera uma chave de cache única para uma página específica de um PDF."""
    # Obter o caminho completo do arquivo
    if pdf_path.startswith('/'):
        pdf_path = pdf_path[1:]

    full_path = os.path.join(settings.MEDIA_ROOT, pdf_path)

    # Obter a data de modificação do arquivo
    try:
        mtime = os.path.getmtime(full_path)
    except (FileNotFoundError, OSError):
        # Se o arquivo não existir, usar o caminho como parte da chave
        mtime = 0

    # Criar uma string com todos os parâmetros relevantes
    key_data = f"{pdf_path}:{mtime}:{page_number}:{dpi}:{format}:{quality}"

    # Gerar um hash MD5 da string
    return hashlib.md5(key_data.encode()).hexdigest()

def get_cached_image_path(cache_key, format=OUTPUT_FORMAT):
    """Retorna o caminho para a imagem em cache."""
    extension = format.lower()
    return os.path.join(CACHE_DIR, f"{cache_key}.{extension}")

def is_cached(cache_key, format=OUTPUT_FORMAT):
    """Verifica se a imagem está em cache."""
    cache_path = get_cached_image_path(cache_key, format)
    return os.path.exists(cache_path)

def convert_pdf_page_to_image(pdf_path, page_number, dpi=DPI, format=OUTPUT_FORMAT, quality=JPEG_QUALITY, use_cache=True):
    """
    Converte uma página específica de um PDF em uma imagem.

    Args:
        pdf_path: Caminho relativo do arquivo PDF no storage
        page_number: Número da página a ser convertida (começando em 1)
        dpi: Resolução da imagem em DPI
        format: Formato de saída da imagem (JPEG, PNG)
        quality: Qualidade da imagem (1-100, apenas para JPEG)
        use_cache: Se True, usa o cache para evitar reconversão

    Returns:
        Caminho relativo da imagem convertida no storage
    """
    start_time = time.time()

    # Gerar chave de cache
    cache_key = get_cache_key(pdf_path, page_number, dpi, format, quality)
    cache_path = get_cached_image_path(cache_key, format)

    # Verificar se a imagem já está em cache
    if use_cache and is_cached(cache_key, format):
        logger.info(f"Usando imagem em cache para {pdf_path} página {page_number}")
        # Retornar caminho relativo ao MEDIA_URL
        relative_path = os.path.relpath(cache_path, settings.MEDIA_ROOT)
        return relative_path

    # Obter o caminho completo do arquivo PDF
    if pdf_path.startswith('/'):
        pdf_path = pdf_path[1:]

    full_path = os.path.join(settings.MEDIA_ROOT, pdf_path)

    try:
        # Verificar se o arquivo existe
        if not os.path.exists(full_path):
            logger.error(f"Arquivo PDF não encontrado: {full_path}")
            raise FileNotFoundError(f"Arquivo PDF não encontrado: {pdf_path}")

        # Converter a página do PDF em imagem
        logger.info(f"Convertendo página {page_number} do PDF {pdf_path}")

        # Preparar argumentos para a conversão
        convert_args = {
            'dpi': dpi,
            'first_page': page_number,
            'last_page': page_number,
            'fmt': format.lower(),
            'jpegopt': {"quality": quality} if format.upper() == 'JPEG' else None
        }

        # Adicionar o caminho do Poppler no Windows
        if POPPLER_PATH:
            convert_args['poppler_path'] = POPPLER_PATH

        # Converter a página do PDF em imagem
        images = convert_from_path(full_path, **convert_args)

        if not images:
            logger.error(f"Nenhuma imagem gerada para {pdf_path} página {page_number}")
            raise ValueError(f"Falha ao converter página {page_number} do PDF {pdf_path}")

        # Salvar a imagem no cache
        image = images[0]
        image.save(cache_path, format=format, quality=quality if format.upper() == 'JPEG' else None)

        # Registrar tempo de conversão
        elapsed_time = time.time() - start_time
        logger.info(f"Página {page_number} convertida em {elapsed_time:.2f} segundos")

        # Retornar caminho relativo ao MEDIA_URL
        relative_path = os.path.relpath(cache_path, settings.MEDIA_ROOT)
        return relative_path

    except Exception as e:
        logger.exception(f"Erro ao converter página {page_number} do PDF {pdf_path}: {str(e)}")
        raise
