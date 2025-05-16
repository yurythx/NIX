from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from .models import Rating
from .serializers import RatingSerializer, RatingSummarySerializer, ContentTypeSerializer

class RatingViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar avaliações
    """
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """
        Filtrar avaliações por tipo de conteúdo e ID do objeto, se fornecidos
        """
        queryset = super().get_queryset()

        # Filtrar por tipo de conteúdo
        content_type = self.request.query_params.get('content_type')
        if content_type:
            app_label, model = content_type.split('.')
            content_type_obj = ContentType.objects.get(app_label=app_label, model=model)
            queryset = queryset.filter(content_type=content_type_obj)

        # Filtrar por ID do objeto
        object_id = self.request.query_params.get('object_id')
        if object_id:
            queryset = queryset.filter(object_id=object_id)

        return queryset

    def perform_create(self, serializer):
        """
        Associar o usuário atual à avaliação
        """
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Retorna um resumo das avaliações para um tipo de conteúdo e ID de objeto específicos
        """
        # Obter parâmetros da requisição
        content_type_str = request.query_params.get('content_type')
        object_id = request.query_params.get('object_id')

        # Validar parâmetros
        if not content_type_str or not object_id:
            return Response(
                {"error": "Os parâmetros 'content_type' e 'object_id' são obrigatórios"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Obter o objeto ContentType
            app_label, model = content_type_str.split('.')
            content_type = ContentType.objects.get(app_label=app_label, model=model)

            # Obter o resumo das avaliações
            summary = Rating.get_rating_summary(content_type, object_id)

            # Serializar e retornar o resumo
            serializer = RatingSummarySerializer(summary)
            return Response(serializer.data)

        except ValueError:
            return Response(
                {"error": "Formato inválido para 'content_type'. Use o formato 'app_label.model'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ContentType.DoesNotExist:
            return Response(
                {"error": f"Tipo de conteúdo '{content_type_str}' não encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def content_types(self, request):
        """
        Retorna todos os tipos de conteúdo disponíveis para avaliação
        """
        content_types = ContentType.objects.all()
        serializer = ContentTypeSerializer(content_types, many=True)
        return Response(serializer.data)
