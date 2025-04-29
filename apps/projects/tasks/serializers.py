from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Task, Comment, Attachment, Label, TaskHistory
from apps.projects.boards.models import Board, Column

User = get_user_model()

class LabelSerializer(serializers.ModelSerializer):
    """Serializador para etiquetas de tarefas"""
    
    class Meta:
        model = Label
        fields = ['id', 'name', 'color', 'board', 'created_at']
        read_only_fields = ['id', 'created_at']
        ref_name = "TasksLabelSerializer"  # Nome único para evitar conflito
    
    def validate(self, attrs):
        # Verificar se o usuário tem permissão para criar etiquetas no quadro
        board = attrs.get('board')
        request = self.context.get('request')
        if board and request and not board.boardmembership_set.filter(
            user=request.user, 
            role__in=['admin', 'editor']
        ).exists():
            raise serializers.ValidationError("Você não tem permissão para criar etiquetas neste quadro.")
        return attrs

class AttachmentSerializer(serializers.ModelSerializer):
    """Serializador para anexos em tarefas"""
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Attachment
        fields = ['id', 'task', 'user', 'file', 'file_url', 'name', 'file_type', 'size', 'created_at']
        read_only_fields = ['id', 'user', 'file_type', 'size', 'created_at']
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        
        # Obter tipo e tamanho do arquivo
        file = validated_data.get('file')
        if file:
            # Obter tipo de arquivo
            validated_data['file_type'] = file.content_type
            # Obter tamanho do arquivo
            validated_data['size'] = file.size
        
        return super().create(validated_data)

class CommentSerializer(serializers.ModelSerializer):
    """Serializador para comentários em tarefas"""
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    username = serializers.ReadOnlyField(source='user.username')
    mentioned_users = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = Comment
        fields = ['id', 'task', 'user', 'username', 'content', 'mentioned_users', 
                  'created_at', 'updated_at', 'is_edited']
        read_only_fields = ['id', 'user', 'username', 'created_at', 'updated_at', 'is_edited']
    
    def create(self, validated_data):
        # Atribuir usuário atual como autor do comentário
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class TaskHistorySerializer(serializers.ModelSerializer):
    """Serializador para histórico de tarefas"""
    username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = TaskHistory
        fields = ['id', 'task', 'user', 'username', 'action', 'description', 'created_at']
        read_only_fields = ['id', 'task', 'user', 'username', 'action', 'description', 'created_at']

class TaskListSerializer(serializers.ModelSerializer):
    """Serializador para listagem de tarefas"""
    column_name = serializers.ReadOnlyField(source='column.name')
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    assignees_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    attachments_count = serializers.SerializerMethodField()
    labels = LabelSerializer(many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'slug', 'board', 'column', 'column_name',
                  'order', 'created_by', 'created_by_username', 'assignees_count',
                  'labels', 'due_date', 'priority', 'status', 'is_archived',
                  'completion_percentage', 'comments_count', 'attachments_count', 
                  'created_at', 'updated_at', 'completed_at']
        read_only_fields = ['id', 'slug', 'created_by', 'created_at', 'updated_at', 'completed_at']
    
    def get_assignees_count(self, obj):
        return obj.assignees.count()
    
    def get_comments_count(self, obj):
        return obj.comments.count()
    
    def get_attachments_count(self, obj):
        return obj.attachments.count()

class TaskDetailSerializer(TaskListSerializer):
    """Serializador detalhado para tarefas"""
    assignees = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False
    )
    assignees_detail = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    parent_task_title = serializers.ReadOnlyField(source='parent_task.title')
    subtasks_count = serializers.SerializerMethodField()
    
    class Meta(TaskListSerializer.Meta):
        fields = TaskListSerializer.Meta.fields + [
            'assignees', 'assignees_detail', 'parent_task', 'parent_task_title',
            'start_date', 'estimated_time', 'subtasks_count', 'comments', 'attachments'
        ]
    
    def get_assignees_detail(self, obj):
        return [
            {
                'id': user.id,
                'username': user.username,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'avatar': user.avatar.url if user.avatar else None
            }
            for user in obj.assignees.all()
        ]
    
    def get_subtasks_count(self, obj):
        return obj.subtasks.count()

class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializador para criação e atualização de tarefas"""
    assignees = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False
    )
    labels = serializers.PrimaryKeyRelatedField(
        queryset=Label.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = Task
        fields = ['title', 'description', 'board', 'column', 'order', 'assignees',
                  'labels', 'parent_task', 'due_date', 'start_date', 'estimated_time',
                  'priority', 'status', 'completion_percentage']
    
    def validate(self, attrs):
        board = attrs.get('board')
        column = attrs.get('column')
        
        # Verificar se a coluna pertence ao quadro
        if board and column and column.board.id != board.id:
            raise serializers.ValidationError({"column": "Esta coluna não pertence ao quadro selecionado."})
        
        # Verificar se as etiquetas pertencem ao quadro
        labels = attrs.get('labels', [])
        if board and labels:
            for label in labels:
                if label.board.id != board.id:
                    raise serializers.ValidationError({"labels": f"A etiqueta '{label.name}' não pertence ao quadro selecionado."})
        
        # Verificar se o usuário tem permissão para interagir com o quadro
        request = self.context.get('request')
        if board and request and not board.members.filter(id=request.user.id).exists():
            raise serializers.ValidationError("Você não tem permissão para criar tarefas neste quadro.")
        
        return attrs
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)