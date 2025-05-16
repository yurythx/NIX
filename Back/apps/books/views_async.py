"""
Views assíncronas para o app de livros
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.http import Http404
import logging

from .models import Book
from .serializers import BookSerializer
from core.services.pdf_service_async import async_pdf_service
from core.services.audio_service_async import async_audio_service

# Configurar logging
logger = logging.getLogger(__name__)

class AsyncBookViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para operações assíncronas com livros
    """
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    
    @action(detail=True, methods=['post'])
    def preload_pdf(self, request, slug=None):
        """
        Pré-carrega um arquivo PDF
        """
        book = self.get_object()
        
        # Verificar se o livro tem arquivo PDF
        if not book.pdf_file:
            raise Http404("Este livro não possui arquivo PDF")
            
        # Obter o caminho do arquivo PDF
        pdf_path = book.pdf_file.path
        
        # Pré-carregar o PDF
        task_id = async_pdf_service.preload_pdf(pdf_path)
        
        if not task_id:
            return Response(
                {"error": "Erro ao iniciar o pré-carregamento do PDF"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Retornar o ID da tarefa
        return Response({
            "task_id": task_id,
            "message": "Pré-carregamento iniciado"
        })
    
    @action(detail=True, methods=['post'])
    def preload_pdf_images(self, request, slug=None):
        """
        Pré-carrega as imagens de um arquivo PDF
        """
        book = self.get_object()
        
        # Verificar se o livro tem arquivo PDF
        if not book.pdf_file:
            raise Http404("Este livro não possui arquivo PDF")
            
        # Obter o caminho do arquivo PDF
        pdf_path = book.pdf_file.path
        
        # Obter os parâmetros da requisição
        page_range = request.data.get('page_range', None)
        if page_range:
            page_range = (int(page_range[0]), int(page_range[1]))
        
        format = request.data.get('format', 'JPEG').upper()
        if format not in ['JPEG', 'PNG', 'TIFF']:
            format = 'JPEG'
        
        dpi = int(request.data.get('dpi', 200))
        quality = int(request.data.get('quality', 85))
        
        # Pré-carregar as imagens
        task_id = async_pdf_service.preload_pdf_images(pdf_path, page_range, format, dpi, quality)
        
        if not task_id:
            return Response(
                {"error": "Erro ao iniciar o pré-carregamento das imagens do PDF"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Retornar o ID da tarefa
        return Response({
            "task_id": task_id,
            "message": "Pré-carregamento de imagens iniciado"
        })
    
    @action(detail=True, methods=['post'])
    def preload_audio(self, request, slug=None):
        """
        Pré-carrega um arquivo de áudio
        """
        book = self.get_object()
        
        # Verificar se o livro tem arquivo de áudio
        if not book.audio_file:
            raise Http404("Este livro não possui arquivo de áudio")
            
        # Obter o caminho do arquivo de áudio
        audio_path = book.audio_file.path
        
        # Pré-carregar o áudio
        task_id = async_audio_service.preload_audio(audio_path)
        
        if not task_id:
            return Response(
                {"error": "Erro ao iniciar o pré-carregamento do áudio"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Retornar o ID da tarefa
        return Response({
            "task_id": task_id,
            "message": "Pré-carregamento iniciado"
        })
    
    @action(detail=True, methods=['post'])
    def preload_audio_chunk(self, request, slug=None):
        """
        Pré-carrega um chunk de um arquivo de áudio
        """
        book = self.get_object()
        
        # Verificar se o livro tem arquivo de áudio
        if not book.audio_file:
            raise Http404("Este livro não possui arquivo de áudio")
            
        # Obter o caminho do arquivo de áudio
        audio_path = book.audio_file.path
        
        # Obter os parâmetros da requisição
        chunk_size = int(request.data.get('chunk_size', 1024*1024))  # 1MB por padrão
        
        # Pré-carregar o chunk
        task_id = async_audio_service.preload_audio_chunk(audio_path, chunk_size)
        
        if not task_id:
            return Response(
                {"error": "Erro ao iniciar o pré-carregamento do chunk de áudio"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Retornar o ID da tarefa
        return Response({
            "task_id": task_id,
            "message": "Pré-carregamento de chunk iniciado"
        })
    
    @action(detail=False, methods=['get'])
    def task_status(self, request):
        """
        Obtém o status de uma tarefa
        """
        # Obter o ID da tarefa
        task_id = request.query_params.get('task_id', None)
        
        if not task_id:
            return Response(
                {"error": "ID da tarefa não fornecido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obter o tipo da tarefa
        task_type = request.query_params.get('task_type', 'pdf')
        
        # Obter o status da tarefa
        if task_type == 'pdf':
            status_info = async_pdf_service.get_preload_status(task_id)
        elif task_type == 'audio':
            status_info = async_audio_service.get_preload_status(task_id)
        else:
            return Response(
                {"error": f"Tipo de tarefa inválido: {task_type}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Retornar o status
        return Response(status_info)
    
    @action(detail=True, methods=['get'])
    def audio_chunk(self, request, slug=None):
        """
        Obtém um chunk de um arquivo de áudio
        """
        book = self.get_object()
        
        # Verificar se o livro tem arquivo de áudio
        if not book.audio_file:
            raise Http404("Este livro não possui arquivo de áudio")
            
        # Obter o caminho do arquivo de áudio
        audio_path = book.audio_file.path
        
        # Obter os parâmetros da requisição
        chunk_index = int(request.query_params.get('chunk_index', 0))
        chunk_size = int(request.query_params.get('chunk_size', 1024*1024))  # 1MB por padrão
        
        # Obter o chunk
        chunk = async_audio_service.get_audio_chunk(audio_path, chunk_index, chunk_size)
        
        if chunk is None:
            return Response(
                {"error": f"Erro ao obter chunk {chunk_index}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Retornar o chunk como uma resposta binária
        from django.http import HttpResponse
        response = HttpResponse(chunk, content_type='application/octet-stream')
        response['Content-Disposition'] = f'attachment; filename="{book.slug}_chunk_{chunk_index}.bin"'
        return response
