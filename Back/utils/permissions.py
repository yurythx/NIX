from rest_framework import permissions

class BasePermission(permissions.BasePermission):
    """
    Classe base para centralizar verificações comuns de permissões.
    """
    def is_safe_method(self, request):
        return request.method in permissions.SAFE_METHODS

    def is_team_admin(self, user, team):
        return team.teammembership_set.filter(user=user, role='admin').exists()

    def is_board_admin(self, user, board):
        return board.boardmembership_set.filter(user=user, role='admin').exists()

    def is_task_assignee(self, user, task):
        return task.assignees.filter(id=user.id).exists()

class IsTeamAdminOrReadOnly(BasePermission):
    """
    Permissão personalizada para permitir que apenas administradores de equipes 
    editem objetos, mas qualquer usuário autenticado possa visualizá-los.
    """
    def has_permission(self, request, view):
        if self.is_safe_method(request):
            return request.user.is_authenticated
        if view.action == 'create':
            return request.user.is_authenticated
        return True

    def has_object_permission(self, request, view, obj):
        if self.is_safe_method(request):
            return request.user.is_authenticated
        return self.is_team_admin(request.user, obj)

class IsTeamMember(BasePermission):
    """
    Permissão personalizada para permitir acesso apenas a membros da equipe.
    """
    def has_object_permission(self, request, view, obj):
        return obj.members.filter(id=request.user.id).exists()

class IsBoardAdminOrReadOnly(BasePermission):
    """
    Permissão personalizada para permitir que apenas administradores de quadros
    editem objetos, mas qualquer usuário com acesso ao quadro possa visualizá-los.
    """
    def has_permission(self, request, view):
        if self.is_safe_method(request) and view.action == 'list':
            return request.user.is_authenticated
        if view.action == 'create':
            return request.user.is_authenticated
        return True

    def has_object_permission(self, request, view, obj):
        if self.is_safe_method(request):
            return obj.team.members.filter(id=request.user.id).exists()
        return self.is_board_admin(request.user, obj) or self.is_team_admin(request.user, obj.team)

class IsBoardMember(BasePermission):
    """
    Permissão personalizada para permitir que apenas membros do quadro possam acessá-lo.
    """
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'owner') and obj.owner == request.user:
            return True
        if hasattr(obj, 'board'):
            return obj.board.memberships.filter(user=request.user).exists()
        return obj.memberships.filter(user=request.user).exists()

class IsTaskAssigneeOrBoardMember(BasePermission):
    """
    Permissão personalizada para permitir que atribuídos à tarefa ou membros do quadro
    possam editar tarefas.
    """
    def has_object_permission(self, request, view, obj):
        if self.is_safe_method(request):
            return obj.board.team.members.filter(id=request.user.id).exists()
        return (
            self.is_task_assignee(request.user, obj) or
            self.is_board_admin(request.user, obj.board) or
            self.is_team_admin(request.user, obj.board.team)
        )

class IsCommentAuthorOrTaskAssignee(BasePermission):
    """
    Permissão personalizada para permitir que apenas o autor do comentário ou
    os responsáveis pela tarefa possam editar/excluir comentários.
    """
    def has_object_permission(self, request, view, obj):
        if self.is_safe_method(request):
            return request.user.is_authenticated
        if obj.user == request.user:
            return True
        return self.is_task_assignee(request.user, obj.task)

class IsOwnerOrReadOnly(BasePermission):
    """
    Permissão personalizada para permitir que apenas o dono do objeto possa editá-lo.
    """
    def has_object_permission(self, request, view, obj):
        if self.is_safe_method(request):
            return True
        return obj.owner == request.user