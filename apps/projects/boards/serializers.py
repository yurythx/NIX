from rest_framework import serializers
from .models import Board, BoardMembership, Column, Label
from apps.projects.teams.models import Team
from django.shortcuts import get_object_or_404

class LabelSerializer(serializers.ModelSerializer):
    """Serializador para etiquetas"""
    class Meta:
        model = Label
        fields = ['id', 'name', 'color', 'board', 'created_at']
        read_only_fields = ['id', 'created_at']
        ref_name = "BoardsLabelSerializer"

class ColumnSerializer(serializers.ModelSerializer):
    """Serializador para colunas"""
    tasks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Column
        fields = ['id', 'name', 'description', 'board', 'position', 'color', 
                 'icon', 'is_collapsed', 'created_at', 'updated_at', 'tasks_count']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_tasks_count(self, obj):
        return obj.tasks.count()

class BoardMembershipSerializer(serializers.ModelSerializer):
    """Serializador para associação entre usuários e quadros"""
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = BoardMembership
        fields = ['id', 'user', 'board', 'role', 'joined_at', 'username', 'email', 'full_name']
        read_only_fields = ['id', 'joined_at']
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

class BoardMembershipCreateSerializer(serializers.ModelSerializer):
    """Serializador para criação de associação entre usuários e quadros"""
    class Meta:
        model = BoardMembership
        fields = ['user', 'role']
    
    def create(self, validated_data):
        board = self.context['board']
        return BoardMembership.objects.create(board=board, **validated_data)

class BoardListSerializer(serializers.ModelSerializer):
    """Serializador para listagem de quadros"""
    team_name = serializers.ReadOnlyField(source='team.name')
    columns_count = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    
    class Meta:
        model = Board
        fields = ['id', 'name', 'description', 'team', 'team_name', 'board_type', 
                  'is_public', 'is_archived', 'icon', 'color', 'slug', 
                  'created_by', 'created_by_username', 'columns_count', 
                  'members_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'slug', 'created_by', 'created_at', 'updated_at']
    
    def get_columns_count(self, obj):
        return obj.columns.count()
    
    def get_members_count(self, obj):
        return obj.members.count()

class BoardDetailSerializer(BoardListSerializer):
    """Serializador detalhado para quadros com colunas"""
    columns = ColumnSerializer(many=True, read_only=True)
    labels = LabelSerializer(many=True, read_only=True)
    members = BoardMembershipSerializer(source='boardmembership_set', many=True, read_only=True)
    
    class Meta(BoardListSerializer.Meta):
        fields = BoardListSerializer.Meta.fields + ['columns', 'labels', 'members']

class BoardCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializador para criação e atualização de quadros"""
    team_slug = serializers.SlugField(write_only=True)
    
    class Meta:
        model = Board
        fields = ['name', 'description', 'board_type', 'is_public', 'icon', 'color', 'team_slug']
    
    def validate_team_slug(self, value):
        request = self.context.get('request')
        try:
            team = Team.objects.get(slug=value)
            # Verificar se o usuário pertence à equipe
            if not team.members.filter(id=request.user.id).exists():
                raise serializers.ValidationError("Você não pertence a esta equipe.")
            return value
        except Team.DoesNotExist:
            raise serializers.ValidationError("Equipe não encontrada.")
    
    def create(self, validated_data):
        team_slug = validated_data.pop('team_slug')
        team = get_object_or_404(Team, slug=team_slug)
        
        validated_data['team'] = team
        validated_data['created_by'] = self.context['request'].user
        
        board = Board.objects.create(**validated_data)
        
        # Adicionar o criador como admin do quadro
        BoardMembership.objects.create(
            user=validated_data['created_by'],
            board=board,
            role='admin'
        )
        
        # Criar colunas padrão para quadros Kanban
        if board.board_type == 'kanban':
            Column.objects.create(
                board=board,
                name='A fazer',
                position=1,
                color='#3498db'
            )
            Column.objects.create(
                board=board,
                name='Em progresso',
                position=2,
                color='#f39c12'
            )
            Column.objects.create(
                board=board,
                name='Concluído',
                position=3,
                color='#2ecc71'
            )
        
        return board
    
    def update(self, instance, validated_data):
        if 'team_slug' in validated_data:
            team_slug = validated_data.pop('team_slug')
            team = get_object_or_404(Team, slug=team_slug)
            instance.team = team
            
        return super().update(instance, validated_data)