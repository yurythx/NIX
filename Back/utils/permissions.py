from rest_framework import permissions

class IsTeamAdminOrReadOnly(permissions.BasePermission):
    """
    Permissão personalizada para permitir que apenas administradores de equipes 
    editem objetos, mas qualquer usuário autenticado possa visualizá-los.
    """
    
    def has_permission(self, request, view):
        # Permitir listagem e detalhes para qualquer usuário autenticado
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Para ações de criação, qualquer usuário autenticado pode criar uma equipe
        if view.action == 'create':
            return request.user.is_authenticated
            
        # Para outras ações, a verificação será feita em has_object_permission
        return True
    
    def has_object_permission(self, request, view, obj):
        # Permitir leitura para qualquer usuário autenticado
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Verificar se o usuário é administrador da equipe
        return obj.teammembership_set.filter(user=request.user, role='admin').exists()

class IsTeamMember(permissions.BasePermission):
    """
    Permissão personalizada para permitir acesso apenas a membros da equipe.
    """
    
    def has_object_permission(self, request, view, obj):
        # Verificar se o usuário é membro da equipe
        return obj.members.filter(id=request.user.id).exists()

class IsBoardAdminOrReadOnly(permissions.BasePermission):
    """
    Permissão personalizada para permitir que apenas administradores de quadros
    editem objetos, mas qualquer usuário com acesso ao quadro possa visualizá-los.
    """
    
    def has_permission(self, request, view):
        # Permitir listagem para qualquer usuário autenticado
        if request.method in permissions.SAFE_METHODS and view.action == 'list':
            return request.user.is_authenticated
            
        # Para ações de criação, qualquer usuário autenticado pode criar um quadro
        if view.action == 'create':
            return request.user.is_authenticated
            
        # Para outras ações, a verificação será feita em has_object_permission
        return True
    
    def has_object_permission(self, request, view, obj):
        # Permitir leitura para membros do quadro
        if request.method in permissions.SAFE_METHODS:
            return obj.team.members.filter(id=request.user.id).exists()
        
        # Verificar se o usuário é administrador do quadro ou administrador da equipe
        is_board_admin = obj.boardmembership_set.filter(user=request.user, role='admin').exists()
        is_team_admin = obj.team.teammembership_set.filter(user=request.user, role='admin').exists()
        
        return is_board_admin or is_team_admin

class IsBoardMember(permissions.BasePermission):
    """
    Permissão personalizada para permitir que apenas membros do quadro possam acessá-lo.
    """
    def has_object_permission(self, request, view, obj):
        # Verifica se o usuário é o dono do quadro
        if hasattr(obj, 'owner') and obj.owner == request.user:
            return True
            
        # Verifica se o usuário é membro do quadro
        if hasattr(obj, 'board'):
            return obj.board.memberships.filter(user=request.user).exists()
            
        # Verifica se o usuário é membro do quadro através do objeto
        return obj.memberships.filter(user=request.user).exists()

class IsTaskAssigneeOrBoardMember(permissions.BasePermission):
    """
    Permissão personalizada para permitir que atribuídos à tarefa ou membros do quadro
    possam editar tarefas.
    """
    
    def has_object_permission(self, request, view, obj):
        # Permitir leitura para membros do quadro
        if request.method in permissions.SAFE_METHODS:
            return obj.board.team.members.filter(id=request.user.id).exists()
        
        # Verificar se o usuário é o atribuído à tarefa, administrador do quadro ou administrador da equipe
        is_assignee = obj.assignees.filter(id=request.user.id).exists()
        is_board_admin = obj.board.boardmembership_set.filter(user=request.user, role='admin').exists()
        is_team_admin = obj.board.team.teammembership_set.filter(user=request.user, role='admin').exists()
        
        return is_assignee or is_board_admin or is_team_admin

class IsCommentAuthorOrTaskAssignee(permissions.BasePermission):
    """
    Permissão personalizada para permitir que apenas o autor do comentário ou
    os responsáveis pela tarefa possam editar/excluir comentários.
    """
    
    def has_object_permission(self, request, view, obj):
        # Permitir leitura para qualquer usuário autenticado
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Verificar se o usuário é o autor do comentário
        if obj.user == request.user:
            return True
            
        # Verificar se o usuário é responsável pela tarefa
        return obj.task.assignees.filter(id=request.user.id).exists()

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permissão personalizada para permitir que apenas o dono do objeto possa editá-lo.
    """
    def has_object_permission(self, request, view, obj):
        # Permissões de leitura são permitidas para qualquer requisição
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Permissões de escrita são permitidas apenas para o dono do objeto
        return obj.owner == request.user