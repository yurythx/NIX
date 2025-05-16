"""
Serviço para usuários
Implementa o padrão de serviço para encapsular a lógica de negócios relacionada a usuários
"""

from typing import List, Optional, Dict, Any
from django.db.models import QuerySet
from django.contrib.auth import get_user_model
from apps.accounts.models import UserSettings
from core.repositories.user_repository import user_repository, user_settings_repository
from core.services.base_service import BaseService

User = get_user_model()

class UserService(BaseService):
    """
    Serviço para usuários
    """
    def __init__(self):
        """
        Inicializa o serviço com o repositório de usuários
        """
        super().__init__(user_repository)

    def get_all(self) -> QuerySet:
        """
        Retorna todos os usuários
        """
        try:
            return self.repository.get_all().order_by('-created_at')
        except Exception as e:
            # Log detalhado do erro para depuração
            import traceback
            print(f"Erro ao obter todos os usuários: {str(e)}")
            print(traceback.format_exc())

            # Retornar uma lista vazia em caso de erro
            return User.objects.none()

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """
        Autentica um usuário
        """
        user = self.repository.get_by_email(email)
        if user and user.check_password(password):
            self.repository.update_last_login(user.id)
            return user
        return None

    def register_user(self, username: str, email: str, password: str, **extra_fields) -> User:
        """
        Registra um novo usuário
        """
        # Verificar se o email já está em uso
        if self.repository.get_by_email(email):
            raise ValueError("Email já está em uso")

        # Verificar se o nome de usuário já está em uso
        if self.repository.get_by_username(username):
            raise ValueError("Nome de usuário já está em uso")

        # Criar o usuário
        return self.repository.create_user(
            username=username,
            email=email,
            password=password,
            **extra_fields
        )

    def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """
        Altera a senha de um usuário
        """
        user = self.repository.get_by_id(user_id)
        if not user:
            return False

        # Verificar a senha atual
        if not user.check_password(current_password):
            raise ValueError("Senha atual incorreta")

        # Alterar a senha
        return self.repository.change_password(user_id, new_password)

    def update_profile(self, user_id: str, data: Dict[str, Any]) -> User:
        """
        Atualiza o perfil de um usuário
        """
        user = self.repository.get_by_id(user_id)
        if not user:
            raise ValueError("Usuário não encontrado")

        # Verificar se o email está sendo alterado e se já está em uso
        if 'email' in data and data['email'] != user.email:
            if self.repository.get_by_email(data['email']):
                raise ValueError("Email já está em uso")

        # Verificar se o nome de usuário está sendo alterado e se já está em uso
        if 'username' in data and data['username'] != user.username:
            if self.repository.get_by_username(data['username']):
                raise ValueError("Nome de usuário já está em uso")

        # Atualizar o usuário
        return self.repository.update(user, **data)

    def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Obtém um usuário pelo email
        """
        return self.repository.get_by_email(email)

    def get_user_by_username(self, username: str) -> Optional[User]:
        """
        Obtém um usuário pelo nome de usuário
        """
        return self.repository.get_by_username(username)


class UserSettingsService(BaseService):
    """
    Serviço para configurações de usuário
    """
    def __init__(self):
        """
        Inicializa o serviço com o repositório de configurações de usuário
        """
        super().__init__(user_settings_repository)

    def get_user_settings(self, user_id: str) -> UserSettings:
        """
        Obtém as configurações de um usuário
        """
        settings = self.repository.get_by_user(user_id)
        if not settings:
            # Criar configurações padrão se não existirem
            settings = self.repository.get_or_create_for_user(user_id)
        return settings

    def update_settings(self, user_id: str, data: Dict[str, Any]) -> UserSettings:
        """
        Atualiza as configurações de um usuário
        """
        settings = self.get_user_settings(user_id)
        return self.repository.update(settings, **data)

    def update_theme(self, user_id: str, theme: str) -> bool:
        """
        Atualiza o tema de um usuário
        """
        if theme not in ['light', 'dark', 'system']:
            raise ValueError("Tema inválido")
        return self.repository.update_theme(user_id, theme)

    def update_language(self, user_id: str, language: str) -> bool:
        """
        Atualiza o idioma de um usuário
        """
        if language not in ['pt-BR', 'en-US', 'es']:
            raise ValueError("Idioma inválido")
        return self.repository.update_language(user_id, language)

    def update_comment_settings(self, user_id: str, require_approval: bool, allow_anonymous: bool) -> bool:
        """
        Atualiza as configurações de comentários de um usuário
        """
        return self.repository.update_comment_settings(user_id, require_approval, allow_anonymous)


# Instâncias únicas dos serviços (Singleton)
user_service = UserService()
user_settings_service = UserSettingsService()
