from rest_framework import serializers
from .models import Team, TeamMembership
from django.contrib.auth import get_user_model

User = get_user_model()

class TeamMembershipSerializer(serializers.ModelSerializer):
    """Serializador para associação entre usuários e equipes"""
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TeamMembership
        fields = ['id', 'user', 'team', 'role', 'joined_at', 'username', 'email', 'full_name']
        read_only_fields = ['id', 'joined_at']
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

class TeamMembershipCreateSerializer(serializers.ModelSerializer):
    """Serializador para criação de associação entre usuários e equipes"""
    class Meta:
        model = TeamMembership
        fields = ['user', 'role']
    
    def create(self, validated_data):
        team = self.context['team']
        return TeamMembership.objects.create(team=team, **validated_data)

class TeamListSerializer(serializers.ModelSerializer):
    """Serializador para listagem de equipes"""
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    members_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'logo', 'slug', 'created_by', 
                  'created_by_username', 'members_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'slug', 'created_by', 'created_at', 'updated_at']
    
    def get_members_count(self, obj):
        return obj.members.count()

class TeamDetailSerializer(TeamListSerializer):
    """Serializador detalhado para equipes com lista de membros"""
    members = TeamMembershipSerializer(source='teammembership_set', many=True, read_only=True)
    
    class Meta(TeamListSerializer.Meta):
        fields = TeamListSerializer.Meta.fields + ['members']

class TeamCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializador para criação e atualização de equipes"""
    class Meta:
        model = Team
        fields = ['name', 'description', 'logo']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        team = Team.objects.create(**validated_data)
        
        # Adicionar o criador como admin
        TeamMembership.objects.create(
            user=validated_data['created_by'],
            team=team,
            role='admin'
        )
        
        return team