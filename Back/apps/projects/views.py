from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from ..utils.permissions import IsOwnerOrReadOnly, IsProjectMember
from .models import Project, ProjectMembership
from .serializers import (
    ProjectSerializer, ProjectDetailSerializer,
    ProjectMembershipSerializer
)

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsOwnerOrReadOnly]
    
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Project.objects.none()
            
        return Project.objects.filter(
            owner=self.request.user
        ) | Project.objects.filter(
            memberships__user=self.request.user
        ).distinct()
        
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectSerializer
        
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class ProjectMembershipViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectMembershipSerializer
    permission_classes = [IsProjectMember]
    
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return ProjectMembership.objects.none()
            
        return ProjectMembership.objects.filter(
            project__owner=self.request.user
        ) | ProjectMembership.objects.filter(
            project__memberships__user=self.request.user
        ).distinct()
        
    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user) 