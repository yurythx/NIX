"""
Serviço para gerenciar operações com arquivos PDF
"""

import os
import base64
import hashlib
import logging
from pathlib import Path
from io import BytesIO
from django.conf import settings
from django.core.cache import cache
from .cache_service import cache_service

# Configurar logging
logger = logging.getLogger(__name__)

# Importar PyPDF2 com tratamento de erro
try:
    import PyPDF2
    PYPDF2_AVAILABLE = True
except ImportError:
    logger.warning("PyPDF2 não encontrado. A leitura de PDF não estará disponível.")
    PYPDF2_AVAILABLE = False

# Verificar se pdf2image está disponível
try:
    from pdf2image import convert_from_path
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    logger.warning("pdf2image não encontrado. A conversão de PDF para imagem não estará disponível.")
    PDF2IMAGE_AVAILABLE = False

class PDFService:
    """
    Serviço para gerenciar operações com arquivos PDF
    """

    def __init__(self):
        """
        Inicializa o serviço de PDF
        """
        # Garantir que o diretório de cache existe
        self.cache_dir = settings.PDF_CACHE_DIR
        os.makedirs(self.cache_dir, exist_ok=True)

        # Configurar o caminho para o Poppler (necessário para pdf2image no Windows)
        # Definir diretamente o caminho do Poppler que sabemos que existe
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.poppler_path = os.path.join(base_dir, 'apps', 'mangas', 'poppler', 'Library', 'bin')

        # Verificar se o diretório existe
        if not os.path.exists(self.poppler_path) or not os.path.exists(os.path.join(self.poppler_path, "pdftoppm.exe")):
            # Se não existir, usar o caminho das configurações
            self.poppler_path = settings.POPPLER_PATH

        # Registrar informações de configuração
        logger.info("Configurações de conversão de PDF:")
        logger.info(f"- DPI: 200")
        logger.info(f"- Formato: JPEG")
        logger.info(f"- Qualidade JPEG: 85")
        logger.info(f"- Diretório de cache: {self.cache_dir}")
        logger.info(f"- Poppler path: {self.poppler_path}")

        if not PYPDF2_AVAILABLE:
            logger.error("PyPDF2 não está instalado. A leitura de PDF não estará disponível.")

        if not PDF2IMAGE_AVAILABLE:
            logger.warning("pdf2image não está instalado. A conversão de PDF para imagem não estará disponível.")
        elif not self.poppler_path and os.name == 'nt':
            logger.warning("Poppler não encontrado. A conversão de PDF para imagem pode falhar.")

    def get_pdf_info(self, pdf_path):
        """
        Obtém informações sobre um arquivo PDF

        Args:
            pdf_path (str): Caminho para o arquivo PDF

        Returns:
            dict: Informações sobre o PDF (número de páginas, etc.)
        """
        if not PYPDF2_AVAILABLE:
            logger.error("PyPDF2 não está instalado. Não é possível obter informações do PDF.")
            return None

        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                total_pages = len(pdf_reader.pages)

                # Obter metadados do PDF
                metadata = pdf_reader.metadata

                # Obter tamanho do arquivo
                file_size = os.path.getsize(pdf_path)

                return {
                    'total_pages': total_pages,
                    'metadata': metadata,
                    'file_size': file_size,
                    'file_name': os.path.basename(pdf_path)
                }
        except Exception as e:
            logger.error(f"Erro ao obter informações do PDF: {str(e)}")
            return None

    def get_page_text(self, pdf_path, page_number):
        """
        Obtém o texto de uma página específica do PDF

        Args:
            pdf_path (str): Caminho para o arquivo PDF
            page_number (int): Número da página (começando em 1)

        Returns:
            str: Texto da página
        """
        if not PYPDF2_AVAILABLE:
            logger.error("PyPDF2 não está instalado. Não é possível extrair texto do PDF.")
            return None

        try:
            # Verificar se o texto já está em cache
            cache_key = self._get_cache_key(pdf_path, page_number, 'text')
            cached_text = cache.get(cache_key)

            if cached_text:
                return cached_text

            # Se não estiver em cache, extrair o texto
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)

                # Verificar se o número da página é válido
                if page_number < 1 or page_number > len(pdf_reader.pages):
                    return None

                # Extrair o texto da página
                page = pdf_reader.pages[page_number - 1]
                text = page.extract_text()

                # Armazenar em cache
                cache.set(cache_key, text, timeout=3600)  # Cache por 1 hora

                return text
        except Exception as e:
            logger.error(f"Erro ao extrair texto da página {page_number}: {str(e)}")
            return None

    def get_page_as_image(self, pdf_path, page_number, format='JPEG', dpi=200, quality=85):
        """
        Converte uma página do PDF em imagem

        Args:
            pdf_path (str): Caminho para o arquivo PDF
            page_number (int): Número da página (começando em 1)
            format (str): Formato da imagem (JPEG, PNG, etc.)
            dpi (int): Resolução da imagem em DPI
            quality (int): Qualidade da imagem (para JPEG)

        Returns:
            str: Imagem em formato base64
        """
        if not PDF2IMAGE_AVAILABLE:
            logger.error("pdf2image não está instalado. Não é possível converter PDF em imagem.")
            return None

        try:
            # Verificar se a imagem já está em cache (usando o novo serviço de cache)
            cache_suffix = f"_page{page_number}_{dpi}dpi_{format.lower()}_{quality}"
            cached_file = cache_service.get_cached_file(pdf_path, 'pdf_image', cache_suffix)

            if cached_file:
                # Ler o arquivo de cache
                with open(cached_file, 'rb') as f:
                    img_data = f.read()
                    img_str = base64.b64encode(img_data).decode()
                    return img_str

            # Verificar se o Poppler está configurado
            if not self.poppler_path and os.name == 'nt':
                # Tentar usar o Poppler instalado pelo script
                base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

                # Lista de possíveis caminhos para o Poppler
                poppler_paths = [
                    os.path.join(base_dir, 'apps', 'mangas', 'poppler', 'Library', 'bin'),  # Este é o caminho correto
                    os.path.join(base_dir, 'apps', 'mangas', 'poppler', 'bin')
                ]

                for path in poppler_paths:
                    if os.path.exists(path):
                        # Verificar se os executáveis do Poppler existem
                        if os.path.exists(os.path.join(path, "pdftoppm.exe")) and \
                           os.path.exists(os.path.join(path, "pdfinfo.exe")):
                            self.poppler_path = path
                            logger.info(f"Usando Poppler em: {self.poppler_path}")
                            break
                        else:
                            logger.warning(f"Executáveis do Poppler não encontrados em: {path}")

                if not self.poppler_path:
                    logger.error("Não foi possível encontrar o Poppler em nenhum dos diretórios conhecidos")
                    return None

            # Preparar argumentos para convert_from_path
            kwargs = {
                'pdf_path': pdf_path,
                'dpi': dpi,
                'first_page': page_number,
                'last_page': page_number,
                'fmt': format.lower(),
                'output_folder': None,  # Não salvar diretamente, vamos gerenciar o cache manualmente
                'single_file': True,
                'use_pdftocairo': True,
                'grayscale': False,
                'size': (None, None),
                'jpegopt': {"quality": quality, "progressive": True, "optimize": True}
            }

            # Adicionar caminho do Poppler se estiver configurado
            if self.poppler_path:
                kwargs['poppler_path'] = self.poppler_path
                logger.info(f"Usando Poppler em: {self.poppler_path}")

            # Converter a página específica em imagem
            logger.info(f"Convertendo PDF para imagem com os seguintes parâmetros: {kwargs}")
            images = convert_from_path(**kwargs)

            # Se a conversão foi bem-sucedida, salvar a imagem no cache
            if images and len(images) > 0:
                image = images[0]

                # Salvar a imagem em um buffer
                img_buffer = BytesIO()
                image.save(img_buffer, format=format, quality=quality, optimize=True)
                img_data = img_buffer.getvalue()

                # Salvar no cache
                cache_path = cache_service.get_cache_path(pdf_path, 'pdf_image', cache_suffix)
                if cache_path:
                    with open(cache_path, 'wb') as f:
                        f.write(img_data)
                    logger.info(f"Imagem salva no cache: {cache_path}")

                # Retornar a imagem como base64
                img_str = base64.b64encode(img_data).decode()
                return img_str
            else:
                logger.error("Nenhuma imagem foi gerada pela conversão")
                return None

        except Exception as e:
            logger.error(f"Erro ao converter página {page_number} em imagem: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return None

    def get_pdf_structure(self, pdf_path):
        """
        Obtém a estrutura do PDF (sumário, etc.)

        Args:
            pdf_path (str): Caminho para o arquivo PDF

        Returns:
            dict: Estrutura do PDF
        """
        if not PYPDF2_AVAILABLE:
            logger.error("PyPDF2 não está instalado. Não é possível obter a estrutura do PDF.")
            return None

        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)

                # Obter o sumário (outline) do PDF
                outline = pdf_reader.outline

                # Processar o sumário para um formato mais amigável
                processed_outline = self._process_outline(outline)

                return {
                    'outline': processed_outline
                }
        except Exception as e:
            logger.error(f"Erro ao obter estrutura do PDF: {str(e)}")
            return None

    def _process_outline(self, outline):
        """
        Processa o sumário do PDF para um formato mais amigável

        Args:
            outline: Sumário do PDF

        Returns:
            list: Sumário processado
        """
        if not outline:
            return []

        result = []

        for item in outline:
            if isinstance(item, list):
                # Item é uma lista de subitens
                result.append(self._process_outline(item))
            else:
                # Item é um dicionário com título e página
                try:
                    title = item.title
                    page = item.page.number + 1  # PyPDF2 usa índice 0 para páginas

                    result.append({
                        'title': title,
                        'page': page
                    })
                except:
                    # Ignorar itens inválidos
                    pass

        return result

    def _get_cache_key(self, pdf_path, page_number, suffix):
        """
        Gera uma chave de cache para uma página de PDF

        Args:
            pdf_path (str): Caminho para o arquivo PDF
            page_number (int): Número da página
            suffix (str): Sufixo para a chave

        Returns:
            str: Chave de cache
        """
        # Usar o hash MD5 do caminho do arquivo + data de modificação para a chave
        file_hash = hashlib.md5(pdf_path.encode()).hexdigest()
        mtime = os.path.getmtime(pdf_path)

        return f"pdf_{file_hash}_{mtime}_{page_number}_{suffix}"

# Instância singleton do serviço
pdf_service = PDFService()
