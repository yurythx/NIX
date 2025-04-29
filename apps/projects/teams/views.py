from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend

from .models import Team, TeamMembership
from .serializers import (
    TeamListSerializer, 
    TeamDetailSerializer,
    TeamCreateUpdateSerializer,
    TeamMembershipSerializer,
    TeamMembershipCreateSerializer
)
from utils.permissions import IsTeamAdminOrReadOnly, IsTeamMember

class TeamViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gerenciamento de equipes.
    """
    queryset = Team.objects.all().select_related('created_by')
    serializer_class = TeamListSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeamAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['name', 'created_by']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TeamDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TeamCreateUpdateSerializer
        return TeamListSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsTeamMember])
    def members(self, request, slug=None):
        """Lista todos os membros da equipe."""
        team = self.get_object()
        memberships = TeamMembership.objects.filter(team=team).select_related('user')
        serializer = TeamMembershipSerializer(memberships, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsTeamAdminOrReadOnly])
    def add_member(self, request, slug=None):
        """Adiciona um novo membro à equipe."""
        team = self.get_object()
        serializer = TeamMembershipCreateSerializer(
            data=request.data,
            context={'team': team}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated, IsTeamAdminOrReadOnly],
           url_path='remove-member/(?P<user_id>[^/.]+)')
    def remove_member(self, request, slug=None, user_id=None):
        """Remove um membro da equipe."""
        team = self.get_object()
        membership = get_object_or_404(TeamMembership, team=team, user__id=user_id)
        
        # Não permitir remover o último admin
        if membership.role == 'admin':
            admin_count = TeamMembership.objects.filter(team=team, role='admin').count()
            if admin_count <= 1:
                return Response(
                    {"detail": "Você não pode remover o último administrador da equipe."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['put'], permission_classes=[permissions.IsAuthenticated, IsTeamAdminOrReadOnly],
           url_path='update-role/(?P<user_id>[^/.]+)')
    def update_role(self, request, slug=None, user_id=None):
        """Atualiza o papel de um membro na equipe."""
        team = self.get_object()
        membership = get_object_or_404(TeamMembership, team=team, user__id=user_id)
        
        # Validar se o papel é válido
        if 'role' not in request.data:
            return Response(
                {"role": "Este campo é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        new_role = request.data['role']
        if new_role not in dict(TeamMembership.ROLE_CHOICES):
            return Response(
                {"role": "Papel inválido."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Não permitir remover o último admin
        if membership.role == 'admin' and new_role != 'admin':
            admin_count = TeamMembership.objects.filter(team=team, role='admin').count()
            if admin_count <= 1:
                return Response(
                    {"detail": "Você não pode rebaixar o último administrador da equipe."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        membership.role = new_role
        membership.save()
        
        serializer = TeamMembershipSerializer(membership)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_teams(self, request):
        """Lista todas as equipes do usuário atual."""
        teams = Team.objects.filter(members=request.user)
        serializer = TeamListSerializer(teams, many=True)
        return Response(serializer.data)