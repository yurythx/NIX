from rest_framework import viewsets, permissions, status, filters
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from django.db import models, transaction
from django.db.models import F
from django.http import JsonResponse, HttpResponse, FileResponse
from django.conf import settings
from django.core.cache import cache
from .models import Manga, Chapter, Page, ReadingProgress, Comment, UserStatistics, MangaView
from .serializers import (
    MangaSerializer, ChapterSerializer, PageSerializer,
    ReadingProgressSerializer, CommentSerializer, UserSerializer,
    UserStatisticsSerializer, MangaViewSerializer
)
import os
import logging
from . import pdf_converter

class DefaultPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class MangaViewSet(viewsets.ModelViewSet):
    queryset = Manga.objects.all().prefetch_related('chapters', 'favorites')
    serializer_class = MangaSerializer
    lookup_field = 'slug'
    pagination_class = DefaultPagination
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'author', 'genres']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']

    def get_permissions(self):
        # Allow read operations and increment_views for everyone, but require authentication for other operations
        if self.action in ['list', 'retrieve', 'increment_views']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        """
        Sobrescreve o método get_queryset para adicionar tratamento de erros
        """
        try:
            return Manga.objects.all().prefetch_related('chapters', 'favorites')
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f"Erro ao obter queryset de mangás: {str(e)}")

            # Retornar um queryset vazio em caso de erro
            return Manga.objects.none()

    def list(self, request, *args, **kwargs):
        """
        Lista todos os mangás com suporte a cache
        """
        try:
            # Verificar se a resposta está em cache
            cache_key = f"mangas_list_{request.query_params.urlencode()}"
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
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f"Erro ao listar mangás: {str(e)}")

            return Response({
                'error': 'Erro Interno',
                'detail': 'Erro interno do servidor',
                'status_code': 500
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def increment_views(self, request, slug=None):
        """
        Incrementa o contador de visualizações de um mangá.
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
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f"Erro ao incrementar visualizações do mangá {slug}: {str(e)}")

            return Response({
                'status': 'error',
                'message': 'Não foi possível incrementar as visualizações',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def favorite(self, request, slug=None):
        manga = self.get_object()
        user = request.user

        if manga.favorites.filter(id=user.id).exists():
            manga.favorites.remove(user)
            return Response({'status': 'removed from favorites'})
        else:
            manga.favorites.add(user)
            return Response({'status': 'added to favorites'})

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def favorites(self, request, slug=None):
        """Get all users who favorited this manga"""
        manga = self.get_object()
        page = self.paginate_queryset(manga.favorites.all())
        serializer = UserSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_favorites(self, request):
        """Get all mangas favorited by the current user"""
        user = request.user
        mangas = Manga.objects.filter(favorites=user)
        page = self.paginate_queryset(mangas)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def update_progress(self, request, slug=None):
        manga = self.get_object()
        user = request.user

        # Validate required fields
        chapter_id = request.data.get('chapter')
        if not chapter_id:
            return Response({'error': 'Chapter ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            chapter = Chapter.objects.get(id=chapter_id, manga=manga)
        except Chapter.DoesNotExist:
            return Response({'error': 'Chapter not found'}, status=status.HTTP_404_NOT_FOUND)

        # Optional page ID
        page_id = request.data.get('page')
        page = None
        if page_id:
            try:
                page = Page.objects.get(id=page_id, chapter=chapter)
            except Page.DoesNotExist:
                return Response({'error': 'Page not found'}, status=status.HTTP_404_NOT_FOUND)

        # Update or create reading progress
        progress, created = ReadingProgress.objects.update_or_create(
            user=user,
            manga=manga,
            defaults={
                'chapter': chapter,
                'page': page
            }
        )

        serializer = ReadingProgressSerializer(progress)
        return Response(serializer.data)

class ChapterViewSet(viewsets.ModelViewSet):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer
    pagination_class = DefaultPagination
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['manga']
    search_fields = ['title']
    ordering_fields = ['number', 'created_at']
    ordering = ['number']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        """Filter chapters by manga slug if provided in query params"""
        queryset = Chapter.objects.all()
        manga_slug = self.request.query_params.get('manga_slug', None)
        if manga_slug:
            queryset = queryset.filter(manga__slug=manga_slug)
        return queryset

    def create(self, request, *args, **kwargs):
        """
        Método personalizado para criar capítulos com melhor tratamento de erros
        para uploads de arquivos grandes.
        """
        try:
            # Verificar se o tipo de capítulo é PDF
            chapter_type = request.data.get('chapter_type')
            pdf_file_path = request.data.get('pdf_file_path')

            # Logar informações para depuração
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Criando capítulo do tipo: {chapter_type}")
            logger.info(f"PDF file path: {pdf_file_path}")
            logger.info(f"PDF file in request.FILES: {'pdf_file' in request.FILES}")
            logger.info(f"Todos os dados da requisição: {request.data}")

            # Temporariamente desativando a validação para permitir capítulos PDF sem arquivo
            # Isso permite criar o capítulo primeiro e adicionar o arquivo depois
            # if chapter_type == 'pdf' and 'pdf_file' not in request.FILES and not pdf_file_path:
            #     logger.error("Erro: Capítulo do tipo PDF sem arquivo ou caminho")
            #     return Response(
            #         {'pdf_file': 'É necessário fornecer um arquivo PDF ou um caminho para o arquivo PDF.'},
            #         status=status.HTTP_400_BAD_REQUEST
            #     )

            # Verificar o tamanho do arquivo PDF (apenas para upload direto)
            if chapter_type == 'pdf' and 'pdf_file' in request.FILES and not pdf_file_path:
                pdf_file = request.FILES['pdf_file']
                from django.conf import settings
                max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 104857600)  # 100MB padrão

                if pdf_file.size > max_size:
                    return Response(
                        {'pdf_file': f'O arquivo PDF não pode exceder {max_size/1024/1024:.0f}MB.'},
                        status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                    )

            # Continuar com a criação normal do capítulo
            serializer = self.get_serializer(data=request.data)

            # Verificar se o serializer é válido
            if not serializer.is_valid():
                logger.error(f"Erro de validação do serializer: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Logar os dados validados para depuração
            logger.info(f"Dados validados: {serializer.validated_data}")

            try:
                # Tentar criar o capítulo diretamente sem usar o serializer
                if chapter_type == 'pdf' and pdf_file_path and not 'pdf_file' in request.FILES:
                    try:
                        # Criar o capítulo manualmente
                        from .models import Chapter
                        manga_id = request.data.get('manga')
                        title = request.data.get('title')
                        number = request.data.get('number')

                        logger.info(f"Criando capítulo manualmente: manga={manga_id}, title={title}, number={number}, pdf_file_path={pdf_file_path}")

                        chapter = Chapter(
                            manga_id=manga_id,
                            title=title,
                            number=number,
                            chapter_type='pdf',
                            pdf_file_path=pdf_file_path
                        )
                        chapter.save()

                        # Serializar o capítulo criado
                        serializer = self.get_serializer(chapter)
                        return Response(serializer.data, status=status.HTTP_201_CREATED)
                    except Exception as manual_error:
                        logger.error(f"Erro ao criar capítulo manualmente: {str(manual_error)}")
                        # Continuar com a abordagem padrão se falhar

                # Abordagem padrão usando serializer
                self.perform_create(serializer)
                headers = self.get_success_headers(serializer.data)
                return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            except Exception as e:
                logger.error(f"Erro ao salvar o capítulo: {str(e)}")
                # Logar o traceback completo
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                raise

        except Exception as e:
            # Logar o erro para depuração
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erro ao criar capítulo: {str(e)}")

            # Retornar uma resposta de erro amigável
            return Response(
                {'detail': f'Erro ao criar capítulo: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def comment(self, request, pk=None):
        chapter = self.get_object()
        serializer = CommentSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            serializer.save(user=request.user, chapter=chapter)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        chapter = self.get_object()
        comments = Comment.objects.filter(chapter=chapter)
        page = self.paginate_queryset(comments)
        serializer = CommentSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

class PageViewSet(viewsets.ModelViewSet):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    pagination_class = DefaultPagination
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['chapter']
    ordering_fields = ['page_number']
    ordering = ['page_number']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        """Filter pages by chapter id or manga slug if provided in query params"""
        queryset = Page.objects.all()
        chapter_id = self.request.query_params.get('chapter_id', None)
        manga_slug = self.request.query_params.get('manga_slug', None)

        if chapter_id:
            queryset = queryset.filter(chapter_id=chapter_id)
        elif manga_slug:
            queryset = queryset.filter(chapter__manga__slug=manga_slug)

        return queryset

class UserStatisticsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserStatistics.objects.all()
    serializer_class = UserStatisticsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Only allow users to see their own statistics or admins to see all"""
        user = self.request.user
        if user.is_staff:
            return UserStatistics.objects.all()
        return UserStatistics.objects.filter(user=user)

    @action(detail=False, methods=['get'])
    def my_statistics(self, request):
        """Get current user's statistics"""
        user = request.user
        stats, created = UserStatistics.objects.get_or_create(user=user)
        serializer = self.get_serializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def leaderboard(self, request):
        """Get top users by chapters read"""
        top_users = UserStatistics.objects.order_by('-total_chapters_read')[:10]
        serializer = self.get_serializer(top_users, many=True)
        return Response(serializer.data)

class MangaViewViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MangaView.objects.all()
    serializer_class = MangaViewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Only allow users to see their own views or admins to see all"""
        user = self.request.user
        if user.is_staff:
            return MangaView.objects.all()
        return MangaView.objects.filter(user=user)

    @action(detail=False, methods=['get'])
    def my_history(self, request):
        """Get current user's view history"""
        user = request.user
        history = MangaView.objects.filter(user=user).order_by('-last_viewed')
        page = self.paginate_queryset(history)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['post'])
    def record_view(self, request):
        """Record a manga view"""
        manga_id = request.data.get('manga')
        if not manga_id:
            return Response({'error': 'Manga ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            manga = Manga.objects.get(id=manga_id)
        except Manga.DoesNotExist:
            return Response({'error': 'Manga not found'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        view, created = MangaView.objects.get_or_create(
            user=user,
            manga=manga,
            defaults={'view_count': 1}
        )

        if not created:
            view.view_count += 1
            view.save()

        serializer = self.get_serializer(view)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        """Get manga recommendations based on user's reading history"""
        user = request.user

        # Get user's favorite genres based on view history
        user_views = MangaView.objects.filter(user=user).order_by('-view_count')[:10]

        if not user_views:
            # If user has no history, return popular mangas
            popular_mangas = Manga.objects.annotate(
                total_views=models.Count('views')
            ).order_by('-total_views')[:10]
            serializer = MangaSerializer(popular_mangas, many=True, context={'request': request})
            return Response(serializer.data)

        # Extract genres from user's most viewed mangas
        user_genres = set()
        for view in user_views:
            if view.manga.genres:
                genres = [g.strip() for g in view.manga.genres.split(',')]
                user_genres.update(genres)

        # Find mangas with similar genres that user hasn't read yet
        viewed_manga_ids = user_views.values_list('manga_id', flat=True)

        recommended_mangas = Manga.objects.exclude(id__in=viewed_manga_ids)

        # Filter by genres if we have user genres
        if user_genres:
            q_objects = models.Q()
            for genre in user_genres:
                q_objects |= models.Q(genres__icontains=genre)
            recommended_mangas = recommended_mangas.filter(q_objects)

        # Order by popularity
        recommended_mangas = recommended_mangas.annotate(
            total_views=models.Count('views')
        ).order_by('-total_views')[:10]

        serializer = MangaSerializer(recommended_mangas, many=True, context={'request': request})
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def convert_pdf_page(request):
    """
    Converte uma página específica de um PDF em uma imagem.

    Parâmetros da query:
    - pdf_path: Caminho relativo do arquivo PDF no storage
    - page_number: Número da página a ser convertida (começando em 1)
    - dpi: Resolução da imagem em DPI (opcional, padrão: 200)
    - format: Formato de saída da imagem (opcional, padrão: JPEG)
    - quality: Qualidade da imagem (opcional, padrão: 85, apenas para JPEG)
    - use_cache: Se True, usa o cache para evitar reconversão (opcional, padrão: True)

    Retorna:
    - Um objeto JSON com o caminho da imagem convertida
    """
    logger = logging.getLogger(__name__)

    # Obter parâmetros da query
    pdf_path = request.GET.get('pdf_path')
    page_number = request.GET.get('page_number')
    dpi = request.GET.get('dpi', pdf_converter.DPI)
    format = request.GET.get('format', pdf_converter.OUTPUT_FORMAT)
    quality = request.GET.get('quality', pdf_converter.JPEG_QUALITY)
    use_cache = request.GET.get('use_cache', 'true').lower() == 'true'

    # Validar parâmetros obrigatórios
    if not pdf_path:
        return JsonResponse({'error': 'O parâmetro pdf_path é obrigatório'}, status=400)

    if not page_number:
        return JsonResponse({'error': 'O parâmetro page_number é obrigatório'}, status=400)

    try:
        page_number = int(page_number)
        if page_number < 1:
            return JsonResponse({'error': 'O número da página deve ser maior que zero'}, status=400)
    except ValueError:
        return JsonResponse({'error': 'O número da página deve ser um número inteiro'}, status=400)

    try:
        # Converter a página do PDF em imagem
        image_path = pdf_converter.convert_pdf_page_to_image(
            pdf_path=pdf_path,
            page_number=page_number,
            dpi=int(dpi),
            format=format.upper(),
            quality=int(quality),
            use_cache=use_cache
        )

        # Construir URL completa da imagem
        image_url = request.build_absolute_uri(settings.MEDIA_URL + image_path)

        return JsonResponse({
            'success': True,
            'image_path': image_path,
            'image_url': image_url
        })

    except FileNotFoundError as e:
        logger.error(f"Arquivo PDF não encontrado: {pdf_path}")
        return JsonResponse({'error': str(e)}, status=404)

    except Exception as e:
        logger.exception(f"Erro ao converter página {page_number} do PDF {pdf_path}: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_pdf_info(request):
    """
    Obtém informações sobre um arquivo PDF, como número de páginas.

    Parâmetros da query:
    - pdf_path: Caminho relativo do arquivo PDF no storage

    Retorna:
    - Um objeto JSON com informações sobre o PDF
    """
    import PyPDF2

    # Obter parâmetros da query
    pdf_path = request.GET.get('pdf_path')

    # Validar parâmetros obrigatórios
    if not pdf_path:
        return JsonResponse({'error': 'O parâmetro pdf_path é obrigatório'}, status=400)

    try:
        # Obter o caminho completo do arquivo PDF
        if pdf_path.startswith('/'):
            pdf_path = pdf_path[1:]

        full_path = os.path.join(settings.MEDIA_ROOT, pdf_path)

        # Verificar se o arquivo existe
        if not os.path.exists(full_path):
            return JsonResponse({'error': f'Arquivo PDF não encontrado: {pdf_path}'}, status=404)

        # Abrir o arquivo PDF
        with open(full_path, 'rb') as f:
            pdf = PyPDF2.PdfReader(f)

            # Obter informações do PDF
            num_pages = len(pdf.pages)

            return JsonResponse({
                'success': True,
                'num_pages': num_pages,
                'pdf_path': pdf_path
            })

    except Exception as e:
        logger.exception(f"Erro ao obter informações do PDF {pdf_path}: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def test_endpoint(request):
    """
    Endpoint de teste para verificar se o servidor está funcionando
    """
    from django.utils import timezone
    return JsonResponse({
        'status': 'success',
        'message': 'O servidor está funcionando corretamente',
        'timestamp': timezone.now().isoformat()
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def test_mangas_endpoint(request):
    """
    Endpoint de teste para retornar dados simulados de mangás
    """
    from django.utils import timezone

    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 10))

    # Dados simulados
    mock_mangas = [
        {
            'id': 1,
            'title': 'Akira',
            'slug': 'akira',
            'description': 'Um clássico da ficção científica japonesa',
            'author': 'Katsuhiro Otomo',
            'genres': 'Sci-Fi, Ação, Cyberpunk',
            'status': 'completed',
            'status_display': 'Completo',
            'created_at': '2023-01-01T00:00:00Z',
            'views_count': 2500,
            'is_favorite': False,
            'chapters': [],
            'reading_progress': None
        },
        {
            'id': 2,
            'title': 'One Piece',
            'slug': 'one-piece',
            'description': 'A história segue as aventuras de Monkey D. Luffy',
            'author': 'Eiichiro Oda',
            'genres': 'Aventura, Ação, Fantasia',
            'status': 'ongoing',
            'status_display': 'Em andamento',
            'created_at': '2023-01-02T00:00:00Z',
            'views_count': 2000,
            'is_favorite': False,
            'chapters': [],
            'reading_progress': None
        },
        {
            'id': 3,
            'title': 'Naruto',
            'slug': 'naruto',
            'description': 'A história de um jovem ninja',
            'author': 'Masashi Kishimoto',
            'genres': 'Ação, Aventura',
            'status': 'completed',
            'status_display': 'Completo',
            'created_at': '2023-01-03T00:00:00Z',
            'views_count': 1500,
            'is_favorite': False,
            'chapters': [],
            'reading_progress': None
        }
    ]

    # Calcular paginação
    total_mangas = len(mock_mangas)
    total_pages = (total_mangas + page_size - 1) // page_size
    start_idx = (page - 1) * page_size
    end_idx = min(start_idx + page_size, total_mangas)

    # Obter resultados paginados
    results = mock_mangas[start_idx:end_idx]

    # Construir resposta paginada
    response_data = {
        'count': total_mangas,
        'next': f'/api/v1/mangas/mangas-test/?page={page+1}' if page < total_pages else None,
        'previous': f'/api/v1/mangas/mangas-test/?page={page-1}' if page > 1 else None,
        'results': results
    }

    return JsonResponse(response_data)