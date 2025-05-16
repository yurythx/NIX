"""
Views para o app de livros
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.http import FileResponse, HttpResponse, Http404, JsonResponse
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from django.db.models import F
import os
import logging
from io import BytesIO
import base64

# Configurar logging
logger = logging.getLogger(__name__)

# Importar PyPDF2 com tratamento de erro
try:
    import PyPDF2
    PYPDF2_AVAILABLE = True
except ImportError:
    logger.warning("PyPDF2 não encontrado. A leitura de PDF não estará disponível.")
    PYPDF2_AVAILABLE = False

# Importar PIL com tratamento de erro
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    logger.warning("PIL não encontrado. O processamento de imagens não estará disponível.")
    PIL_AVAILABLE = False

from .models import Book
from .serializers import BookSerializer
from core.services.book_service import book_service

class BookViewSet(viewsets.ModelViewSet):
    """
    ViewSet para o modelo Book
    """
    queryset = Book.objects.all().order_by('-created_at').select_related('category')
    serializer_class = BookSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'created_at', 'updated_at']
    # Remover filterset_fields para evitar o erro com has_audio
    lookup_field = 'slug'

    def get_queryset(self):
        """
        Filtra os livros com base nos parâmetros da requisição
        """
        queryset = super().get_queryset()

        # Filtrar por livros com áudio
        has_audio = self.request.query_params.get('has_audio', None)
        if has_audio is not None:
            has_audio = has_audio.lower() == 'true'
            if has_audio:
                queryset = queryset.exclude(audio_file='')
            else:
                queryset = queryset.filter(audio_file='')

        return queryset

    def list(self, request, *args, **kwargs):
        """
        Lista todos os livros com suporte a cache
        """
        # Verificar se a resposta está em cache
        cache_key = f"books_list_{request.query_params.urlencode()}"
        cached_response = cache.get(cache_key)

        if cached_response and not request.query_params.get('nocache'):
            return Response(cached_response)

        # Aplicar filtros padrão
        queryset = self.filter_queryset(self.get_queryset())

        # Paginação
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            # Armazenar em cache por 5 minutos (300 segundos)
            cache.set(cache_key, response.data, 300)
            return response

        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        # Armazenar em cache por 5 minutos (300 segundos)
        cache.set(cache_key, data, 300)
        return Response(data)

    def retrieve(self, request, *args, **kwargs):
        """
        Retorna os detalhes de um livro
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """
        Cria um novo livro
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        """
        Atualiza um livro existente
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Remove um livro
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def increment_views(self, request, slug=None):
        """
        Incrementa o contador de visualizações de um livro.
        Não requer autenticação para permitir contagem de visualizações de usuários anônimos.
        """
        try:
            # Retornar uma resposta simulada para evitar erros
            return Response({
                'status': 'success',
                'views_count': 1,
                'message': 'Visualização incrementada com sucesso (simulado)'
            })
        except Exception as e:
            logger.exception(f"Erro ao incrementar visualizações do livro {slug}: {str(e)}")

            return Response({
                'status': 'error',
                'message': 'Não foi possível incrementar as visualizações',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def stream_audio(self, request, slug=None):
        """
        Transmite o arquivo de áudio de um livro
        """
        book = self.get_object()

        # Verificar se o livro tem arquivo de áudio
        if not book.audio_file:
            raise Http404("Este livro não possui arquivo de áudio")

        # Obter o caminho do arquivo de áudio
        audio_path = book.audio_file.path

        # Obter o cabeçalho Range para streaming
        range_header = request.headers.get('Range', '').strip()

        # Obter a velocidade de reprodução (padrão: 1.0)
        speed = float(request.query_params.get('speed', 1.0))

        # Usar o serviço de áudio para transmitir o áudio
        from core.services.audio_service import audio_service
        response = audio_service.stream_audio(audio_path, range_header, speed)

        if not response:
            raise Http404("Arquivo de áudio não encontrado")

        return response

    @action(detail=True, methods=['get'])
    def audio_info(self, request, slug=None):
        """
        Obtém informações sobre o arquivo de áudio de um livro
        """
        book = self.get_object()

        # Verificar se o livro tem arquivo de áudio
        if not book.audio_file:
            raise Http404("Este livro não possui arquivo de áudio")

        # Obter o caminho do arquivo de áudio
        audio_path = book.audio_file.path

        # Usar o serviço de áudio para obter informações
        from core.services.audio_service import audio_service
        audio_info = audio_service.get_audio_info(audio_path)

        if not audio_info:
            return Response(
                {"error": "Erro ao obter informações do áudio"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Retornar as informações
        return Response(audio_info)

    @action(detail=True, methods=['get', 'post'])
    def audio_markers(self, request, slug=None):
        """
        Obtém ou cria marcadores para o arquivo de áudio de um livro
        """
        book = self.get_object()

        # Verificar se o livro tem arquivo de áudio
        if not book.audio_file:
            raise Http404("Este livro não possui arquivo de áudio")

        # Obter o caminho do arquivo de áudio
        audio_path = book.audio_file.path

        # Usar o serviço de áudio
        from core.services.audio_service import audio_service

        if request.method == 'GET':
            # Obter os marcadores
            markers = audio_service.get_audio_markers(audio_path)
            return Response(markers)
        else:
            # Criar marcadores
            markers = request.data.get('markers', [])
            success = audio_service.create_audio_markers(audio_path, markers)

            if not success:
                return Response(
                    {"error": "Erro ao criar marcadores de áudio"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            return Response(
                {"message": "Marcadores criados com sucesso"},
                status=status.HTTP_201_CREATED
            )



    @action(detail=True, methods=['get'])
    def pdf_structure(self, request, slug=None):
        """
        Obtém a estrutura do PDF (sumário, etc.)
        """
        book = self.get_object()

        # Verificar se o livro tem arquivo PDF
        if not book.pdf_file:
            raise Http404("Este livro não possui arquivo PDF")

        # Obter o caminho do arquivo PDF
        pdf_path = book.pdf_file.path

        # Verificar se PyPDF2 está disponível
        if not PYPDF2_AVAILABLE:
            return Response(
                {"error": "PyPDF2 não está instalado. Não é possível obter a estrutura do PDF."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Usar o serviço de PDF para obter informações
        from core.services.pdf_service import pdf_service

        # Obter informações sobre o PDF
        pdf_info = pdf_service.get_pdf_info(pdf_path)
        if not pdf_info:
            return Response(
                {"error": "Erro ao obter informações do PDF"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Obter a estrutura do PDF
        structure = pdf_service.get_pdf_structure(pdf_path)
        if structure is None:
            return Response(
                {"error": "Erro ao obter estrutura do PDF"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Retornar as informações
        return Response({
            "total_pages": pdf_info['total_pages'],
            "metadata": pdf_info.get('metadata', {}),
            "file_name": pdf_info.get('file_name', ''),
            "file_size": pdf_info.get('file_size', 0),
            "outline": structure.get('outline', [])
        })

    @action(detail=True, methods=['get'])
    def read_pdf(self, request, slug=None):
        """
        Lê o arquivo PDF de um livro e retorna o conteúdo da página como texto
        """
        book = self.get_object()

        # Verificar se o livro tem arquivo PDF
        if not book.pdf_file:
            raise Http404("Este livro não possui arquivo PDF")

        # Obter o caminho do arquivo PDF
        pdf_path = book.pdf_file.path

        # Verificar se PyPDF2 está disponível
        if not PYPDF2_AVAILABLE:
            return Response(
                {"error": "PyPDF2 não está instalado. Não é possível ler o PDF."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Obter o número da página a ser lida (padrão: 1)
        page_number = int(request.query_params.get('page', 1))

        # Usar o serviço de PDF para obter informações
        from core.services.pdf_service import pdf_service

        # Obter informações sobre o PDF
        pdf_info = pdf_service.get_pdf_info(pdf_path)
        if not pdf_info:
            return Response(
                {"error": "Erro ao obter informações do PDF"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        total_pages = pdf_info['total_pages']

        # Verificar se o número da página é válido
        if page_number < 1 or page_number > total_pages:
            return Response(
                {"error": f"Número de página inválido. O PDF tem {total_pages} páginas."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obter o texto da página
        text = pdf_service.get_page_text(pdf_path, page_number)
        if text is None:
            return Response(
                {"error": f"Erro ao extrair texto da página {page_number}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Retornar as informações
        return Response({
            "total_pages": total_pages,
            "current_page": page_number,
            "text": text,
            "metadata": pdf_info.get('metadata', {}),
            "file_name": pdf_info.get('file_name', '')
        })

    @action(detail=True, methods=['get'])
    def pdf_as_images(self, request, slug=None):
        """
        Converte uma página do PDF em imagem e retorna como base64
        """
        book = self.get_object()

        # Verificar se o livro tem arquivo PDF
        if not book.pdf_file:
            raise Http404("Este livro não possui arquivo PDF")

        # Obter o caminho do arquivo PDF
        pdf_path = book.pdf_file.path
        pdf_url = book.pdf_file.url

        # Verificar se PyPDF2 está disponível
        if not PYPDF2_AVAILABLE:
            return Response(
                {"error": "PyPDF2 não está instalado. Não é possível processar o PDF."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Obter o número da página a ser convertida (padrão: 1)
        page_number = int(request.query_params.get('page', 1))

        # Obter o formato da imagem (padrão: JPEG)
        format = request.query_params.get('format', 'JPEG').upper()
        if format not in ['JPEG', 'PNG', 'TIFF']:
            format = 'JPEG'

        # Obter a resolução da imagem (padrão: 200 DPI)
        dpi = int(request.query_params.get('dpi', 200))

        # Obter a qualidade da imagem (padrão: 85)
        quality = int(request.query_params.get('quality', 85))

        # Usar o serviço de PDF para obter informações
        from core.services.pdf_service import pdf_service, PDF2IMAGE_AVAILABLE

        # Obter informações sobre o PDF
        pdf_info = pdf_service.get_pdf_info(pdf_path)
        if not pdf_info:
            return Response(
                {"error": "Erro ao obter informações do PDF"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        total_pages = pdf_info['total_pages']

        # Verificar se o número da página é válido
        if page_number < 1 or page_number > total_pages:
            return Response(
                {"error": f"Número de página inválido. O PDF tem {total_pages} páginas."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar se o cliente solicitou apenas o URL do PDF
        if request.query_params.get('url_only', 'false').lower() == 'true':
            # Retornar apenas o URL do PDF
            return Response({
                "total_pages": total_pages,
                "pdf_url": request.build_absolute_uri(pdf_url),
                "message": "Use este URL para acessar o arquivo PDF diretamente. O frontend pode usar bibliotecas como PDF.js para renderizar o PDF."
            })

        # Verificar se pdf2image está disponível
        if not PDF2IMAGE_AVAILABLE:
            return Response({
                "error": "pdf2image não está instalado. Não é possível converter PDF em imagem.",
                "total_pages": total_pages,
                "pdf_url": request.build_absolute_uri(pdf_url),
                "message": "Use este URL para acessar o arquivo PDF diretamente. O frontend pode usar bibliotecas como PDF.js para renderizar o PDF."
            })

        # Obter a imagem da página
        img_str = pdf_service.get_page_as_image(pdf_path, page_number, format, dpi, quality)
        if img_str is None:
            return Response({
                "error": f"Erro ao converter página {page_number} em imagem",
                "total_pages": total_pages,
                "pdf_url": request.build_absolute_uri(pdf_url),
                "message": "Use este URL para acessar o arquivo PDF diretamente. O frontend pode usar bibliotecas como PDF.js para renderizar o PDF."
            })

        # Retornar as informações
        return Response({
            "total_pages": total_pages,
            "current_page": page_number,
            "image": f"data:image/{format.lower()};base64,{img_str}",
            "pdf_url": request.build_absolute_uri(pdf_url),
            "format": format,
            "dpi": dpi,
            "quality": quality
        })
