from rest_framework import viewsets, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from .models import Category
from .serializers import CategorySerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly

class CategoryPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    pagination_class = CategoryPagination
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        # Permitir leitura para todos, mas exigir autenticação para criar/editar/excluir
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        """
        Lista todas as categorias
        """
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
