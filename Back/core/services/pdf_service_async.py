"""
Extensão do serviço de PDF com suporte a carregamento assíncrono
"""

import os
import logging
from django.core.cache import cache
from core.services.pdf_service import PDFService, PYPDF2_AVAILABLE, PDF2IMAGE_AVAILABLE
from core.services.async_loader import async_loader

# Configurar logging
logger = logging.getLogger(__name__)

class AsyncPDFService(PDFService):
    """
    Serviço para gerenciar operações com arquivos PDF com suporte a carregamento assíncrono
    """
    
    def __init__(self):
        """
        Inicializa o serviço de PDF assíncrono
        """
        super().__init__()
    
    def preload_pdf(self, pdf_path, callback=None):
        """
        Pré-carrega um arquivo PDF em segundo plano
        
        Args:
            pdf_path (str): Caminho para o arquivo PDF
            callback (callable): Função a ser chamada quando o carregamento for concluído
            
        Returns:
            str: ID da tarefa
        """
        if not PYPDF2_AVAILABLE:
            logger.error("PyPDF2 não está instalado. Não é possível pré-carregar o PDF.")
            return None
        
        # Verificar se o arquivo existe
        if not os.path.exists(pdf_path):
            logger.error(f"Arquivo PDF não encontrado: {pdf_path}")
            return None
        
        # Adicionar tarefa para carregar o PDF
        task_id = async_loader.add_task(
            self._preload_pdf_task,
            args=(pdf_path,),
            callback=callback
        )
        
        return task_id
    
    def _preload_pdf_task(self, pdf_path):
        """
        Tarefa para pré-carregar um arquivo PDF
        
        Args:
            pdf_path (str): Caminho para o arquivo PDF
            
        Returns:
            dict: Informações sobre o PDF
        """
        try:
            # Obter informações sobre o PDF
            info = self.get_pdf_info(pdf_path)
            
            # Pré-carregar o texto de todas as páginas
            if info and 'total_pages' in info:
                for page_number in range(1, info['total_pages'] + 1):
                    self.get_page_text(pdf_path, page_number)
            
            return info
        except Exception as e:
            logger.error(f"Erro ao pré-carregar PDF: {str(e)}")
            return None
    
    def preload_pdf_images(self, pdf_path, page_range=None, format='JPEG', dpi=200, quality=85, callback=None):
        """
        Pré-carrega as imagens de um arquivo PDF em segundo plano
        
        Args:
            pdf_path (str): Caminho para o arquivo PDF
            page_range (tuple): Intervalo de páginas a serem pré-carregadas (início, fim)
            format (str): Formato da imagem (JPEG, PNG, etc.)
            dpi (int): Resolução da imagem em DPI
            quality (int): Qualidade da imagem (para JPEG)
            callback (callable): Função a ser chamada quando o carregamento for concluído
            
        Returns:
            str: ID da tarefa
        """
        if not PDF2IMAGE_AVAILABLE:
            logger.error("pdf2image não está instalado. Não é possível pré-carregar as imagens do PDF.")
            return None
        
        # Verificar se o arquivo existe
        if not os.path.exists(pdf_path):
            logger.error(f"Arquivo PDF não encontrado: {pdf_path}")
            return None
        
        # Adicionar tarefa para carregar as imagens
        task_id = async_loader.add_task(
            self._preload_pdf_images_task,
            args=(pdf_path, page_range, format, dpi, quality),
            callback=callback
        )
        
        return task_id
    
    def _preload_pdf_images_task(self, pdf_path, page_range=None, format='JPEG', dpi=200, quality=85):
        """
        Tarefa para pré-carregar as imagens de um arquivo PDF
        
        Args:
            pdf_path (str): Caminho para o arquivo PDF
            page_range (tuple): Intervalo de páginas a serem pré-carregadas (início, fim)
            format (str): Formato da imagem (JPEG, PNG, etc.)
            dpi (int): Resolução da imagem em DPI
            quality (int): Qualidade da imagem (para JPEG)
            
        Returns:
            dict: Informações sobre as imagens pré-carregadas
        """
        try:
            # Obter informações sobre o PDF
            info = self.get_pdf_info(pdf_path)
            
            if not info or 'total_pages' not in info:
                return None
            
            # Determinar o intervalo de páginas
            if page_range is None:
                start_page = 1
                end_page = info['total_pages']
            else:
                start_page = max(1, page_range[0])
                end_page = min(info['total_pages'], page_range[1])
            
            # Pré-carregar as imagens
            results = {}
            for page_number in range(start_page, end_page + 1):
                img_str = self.get_page_as_image(pdf_path, page_number, format, dpi, quality)
                results[page_number] = img_str is not None
            
            return {
                'total_pages': info['total_pages'],
                'preloaded_pages': results
            }
        except Exception as e:
            logger.error(f"Erro ao pré-carregar imagens do PDF: {str(e)}")
            return None
    
    def get_preload_status(self, task_id):
        """
        Obtém o status de uma tarefa de pré-carregamento
        
        Args:
            task_id (str): ID da tarefa
            
        Returns:
            dict: Status da tarefa
        """
        # Obter o resultado da tarefa
        result = async_loader.get_result(task_id)
        
        if result is None:
            return {'status': 'pending'}
        
        return {'status': 'completed', 'result': result}

# Instância singleton do serviço
async_pdf_service = AsyncPDFService()
