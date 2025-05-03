from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Board, BoardMembership, Column, Label
from .serializers import (
    BoardListSerializer,
    BoardDetailSerializer,
    BoardCreateUpdateSerializer,
    BoardMembershipSerializer,
    BoardMembershipCreateSerializer,
    ColumnSerializer,
    LabelSerializer
)
from utils.permissions import IsOwnerOrReadOnly, IsBoardMember
from utils.mixins import SlugBasedViewSetMixin, HistoryMixin, DuplicateMixin, MultiSerializerViewSetMixin

class BoardViewSet(MultiSerializerViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de quadros.
    """
    queryset = Board.objects.all()
    serializer_class = BoardListSerializer
    permission_classes = [IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['name', 'team', 'board_type', 'is_public', 'is_archived', 'created_by']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    duplicate_exclude_fields = ['id', 'created_at', 'updated_at', 'slug', 'members']
    
    serializers = {
        'list': BoardListSerializer,
        'retrieve': BoardDetailSerializer,
        'create': BoardCreateUpdateSerializer,
        'update': BoardCreateUpdateSerializer,
        'partial_update': BoardCreateUpdateSerializer,
    }
    
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return self.queryset.none()
            
        return self.queryset.filter(
            Q(owner=self.request.user) |
            Q(memberships__user=self.request.user)
        ).distinct()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return BoardDetailSerializer
        return BoardListSerializer
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['get'], permission_classes=[IsBoardMember])
    def members(self, request, slug=None):
        """Lista todos os membros do quadro."""
        board = self.get_object()
        memberships = BoardMembership.objects.filter(board=board).select_related('user')
        serializer = BoardMembershipSerializer(memberships, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsBoardMember])
    def add_member(self, request, pk=None):
        board = self.get_object()
        serializer = BoardMembershipSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(board=board)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'], permission_classes=[IsOwnerOrReadOnly],
           url_path='remove-member/(?P<user_id>[^/.]+)')
    def remove_member(self, request, slug=None, user_id=None):
        """Remove um membro do quadro."""
        board = self.get_object()
        membership = get_object_or_404(BoardMembership, board=board, user__id=user_id)
        
        # Não permitir remover o último admin
        if membership.role == 'admin':
            admin_count = BoardMembership.objects.filter(board=board, role='admin').count()
            if admin_count <= 1:
                return Response(
                    {"detail": "Você não pode remover o último administrador do quadro."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['put'], permission_classes=[IsOwnerOrReadOnly],
           url_path='update-role/(?P<user_id>[^/.]+)')
    def update_role(self, request, slug=None, user_id=None):
        """Atualiza o papel de um membro no quadro."""
        board = self.get_object()
        membership = get_object_or_404(BoardMembership, board=board, user__id=user_id)
        
        # Validar se o papel é válido
        if 'role' not in request.data:
            return Response(
                {"role": "Este campo é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        new_role = request.data['role']
        if new_role not in dict(BoardMembership.ROLE_CHOICES):
            return Response(
                {"role": "Papel inválido."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Não permitir rebaixar o último admin
        if membership.role == 'admin' and new_role != 'admin':
            admin_count = BoardMembership.objects.filter(board=board, role='admin').count()
            if admin_count <= 1:
                return Response(
                    {"detail": "Você não pode rebaixar o último administrador do quadro."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        membership.role = new_role
        membership.save()
        
        serializer = BoardMembershipSerializer(membership)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsOwnerOrReadOnly])
    def archive(self, request, slug=None):
        """Arquiva um quadro."""
        board = self.get_object()
        board.is_archived = True
        board.save()
        serializer = self.get_serializer(board)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsOwnerOrReadOnly])
    def unarchive(self, request, slug=None):
        """Desarquiva um quadro."""
        board = self.get_object()
        board.is_archived = False
        board.save()
        serializer = self.get_serializer(board)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_boards(self, request):
        """Lista todos os quadros do usuário atual."""
        boards = Board.objects.filter(members=request.user).select_related('team', 'created_by')
        serializer = BoardListSerializer(boards, many=True)
        return Response(serializer.data)


class ColumnViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de colunas.
    """
    queryset = Column.objects.all()
    serializer_class = ColumnSerializer
    permission_classes = [IsBoardMember]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['board']
    ordering_fields = ['position', 'name', 'created_at']
    
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return self.queryset.none()
            
        return Column.objects.filter(
            board__owner=self.request.user
        ) | Column.objects.filter(
            board__memberships__user=self.request.user
        ).distinct()
    
    def perform_create(self, serializer):
        board = get_object_or_404(Board, id=self.request.data.get('board'))
        serializer.save(board=board)
    
    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Reordena as colunas de um quadro."""
        if not request.data or not isinstance(request.data, dict) or 'columns' not in request.data:
            return Response(
                {"detail": "Dados inválidos. Esperado: {'columns': [{'id': 'uuid', 'position': 1}, ...]}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        columns_data = request.data['columns']
        
        # Verificar se todos os elementos são do mesmo quadro
        if not columns_data:
            return Response(
                {"detail": "Lista de colunas vazia."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        first_column = get_object_or_404(Column, id=columns_data[0]['id'])
        board = first_column.board
        
        # Verificar permissão
        if not IsBoardMember().has_object_permission(self.request, self, board):
            return Response(
                {"detail": "Você não tem permissão para reordenar colunas neste quadro."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Atualizar posições
        for column_data in columns_data:
            column = get_object_or_404(Column, id=column_data['id'])
            if column.board != board:
                return Response(
                    {"detail": "Todas as colunas devem pertencer ao mesmo quadro."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            column.position = column_data['position']
            column.save(update_fields=['position'])
        
        return Response({"detail": "Colunas reordenadas com sucesso."})


class LabelViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de etiquetas.
    """
    queryset = Label.objects.all()
    serializer_class = LabelSerializer
    permission_classes = [IsBoardMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['board']
    search_fields = ['name']
    
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return self.queryset.none()
            
        return Label.objects.filter(
            board__owner=self.request.user
        ) | Label.objects.filter(
            board__memberships__user=self.request.user
        ).distinct()
    
    def perform_create(self, serializer):
        board = get_object_or_404(Board, id=self.request.data.get('board'))
        serializer.save(board=board)


class BoardMembershipViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de membros do quadro.
    """
    queryset = BoardMembership.objects.all()
    serializer_class = BoardMembershipSerializer
    permission_classes = [IsBoardMember]
    
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return self.queryset.none()
            
        return BoardMembership.objects.filter(
            board__owner=self.request.user
        ) | BoardMembership.objects.filter(
            board__memberships__user=self.request.user
        ).distinct()