"""
Serviço para gerenciar operações com livros
"""

import os
import logging
from django.conf import settings
from core.services.pdf_service import pdf_service
from core.services.audio_service import audio_service

# Configurar logging
logger = logging.getLogger(__name__)

class BookService:
    """
    Serviço para gerenciar operações com livros
    """

    def __init__(self):
        """
        Inicializa o serviço de livros
        """
        # Garantir que os diretórios existem
        self.books_dir = os.path.join(settings.MEDIA_ROOT, "books")
        self.covers_dir = os.path.join(settings.MEDIA_ROOT, "covers")
        self.audiobooks_dir = os.path.join(settings.MEDIA_ROOT, "audiobooks")

        os.makedirs(self.books_dir, exist_ok=True)
        os.makedirs(self.covers_dir, exist_ok=True)
        os.makedirs(self.audiobooks_dir, exist_ok=True)

    def get_book_info(self, book):
        """
        Obtém informações detalhadas sobre um livro

        Args:
            book: Instância do modelo Book

        Returns:
            dict: Informações detalhadas sobre o livro
        """
        info = {
            'id': book.id,
            'title': book.title,
            'slug': book.slug,
            'description': book.description,
            'cover_image': book.cover_image.url if book.cover_image else None,
            'pdf_file': book.pdf_file.url if book.pdf_file else None,
            'audio_file': book.audio_file.url if book.audio_file else None,
            'created_at': book.created_at,
            'updated_at': book.updated_at,
            'has_pdf': bool(book.pdf_file),
            'has_audio': bool(book.audio_file),
            'pdf_info': None,
            'audio_info': None
        }

        # Obter informações do PDF, se existir
        if book.pdf_file:
            try:
                pdf_info = pdf_service.get_pdf_info(book.pdf_file.path)
                if pdf_info:
                    info['pdf_info'] = {
                        'total_pages': pdf_info.get('total_pages', 0),
                        'file_size': pdf_info.get('file_size', 0),
                        'file_name': pdf_info.get('file_name', '')
                    }
            except Exception as e:
                logger.error(f"Erro ao obter informações do PDF: {str(e)}")

        # Obter informações do áudio, se existir
        if book.audio_file:
            try:
                audio_info = audio_service.get_audio_info(book.audio_file.path)
                if audio_info:
                    info['audio_info'] = {
                        'duration': audio_info.get('duration', 0),
                        'file_size': audio_info.get('file_size', 0),
                        'file_name': audio_info.get('file_name', ''),
                        'mime_type': audio_info.get('mime_type', '')
                    }
            except Exception as e:
                logger.error(f"Erro ao obter informações do áudio: {str(e)}")

        return info

    def get_book_content(self, book, content_type='pdf', page=1, format='JPEG', dpi=200, quality=85):
        """
        Obtém o conteúdo de um livro (PDF ou áudio)

        Args:
            book: Instância do modelo Book
            content_type (str): Tipo de conteúdo ('pdf' ou 'audio')
            page (int): Número da página (para PDF)
            format (str): Formato da imagem (para PDF)
            dpi (int): Resolução da imagem em DPI (para PDF)
            quality (int): Qualidade da imagem (para PDF)

        Returns:
            dict: Conteúdo do livro
        """
        if content_type == 'pdf':
            # Verificar se o livro tem arquivo PDF
            if not book.pdf_file:
                return {'error': 'Este livro não possui arquivo PDF'}

            # Obter informações sobre o PDF
            pdf_info = pdf_service.get_pdf_info(book.pdf_file.path)
            if not pdf_info:
                return {'error': 'Erro ao obter informações do PDF'}

            # Verificar se o número da página é válido
            total_pages = pdf_info['total_pages']
            if page < 1 or page > total_pages:
                return {'error': f'Número de página inválido. O PDF tem {total_pages} páginas.'}

            # Obter o texto da página
            text = pdf_service.get_page_text(book.pdf_file.path, page)
            if text is None:
                return {'error': f'Erro ao extrair texto da página {page}'}

            # Obter a imagem da página
            img_str = pdf_service.get_page_as_image(book.pdf_file.path, page, format, dpi, quality)

            # Retornar as informações
            return {
                'total_pages': total_pages,
                'current_page': page,
                'text': text,
                'image': f"data:image/{format.lower()};base64,{img_str}" if img_str else None,
                'pdf_url': book.pdf_file.url,
                'metadata': pdf_info.get('metadata', {}),
                'file_name': pdf_info.get('file_name', '')
            }
        elif content_type == 'audio':
            # Verificar se o livro tem arquivo de áudio
            if not book.audio_file:
                return {'error': 'Este livro não possui arquivo de áudio'}

            # Obter informações sobre o áudio
            audio_info = audio_service.get_audio_info(book.audio_file.path)
            if not audio_info:
                return {'error': 'Erro ao obter informações do áudio'}

            # Obter os marcadores
            markers = audio_service.get_audio_markers(book.audio_file.path)

            # Retornar as informações
            return {
                'duration': audio_info.get('duration', 0),
                'file_size': audio_info.get('file_size', 0),
                'file_name': audio_info.get('file_name', ''),
                'mime_type': audio_info.get('mime_type', ''),
                'audio_url': book.audio_file.url,
                'markers': markers,
                'metadata': audio_info.get('metadata', {})
            }
        else:
            return {'error': f'Tipo de conteúdo inválido: {content_type}'}

# Instância singleton do serviço
book_service = BookService()
