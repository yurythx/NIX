from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import UserSettings

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializador para o modelo de usuário"""

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'avatar', 'bio', 'position', 'slug', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'slug']
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
        }
        ref_name = "AccountsUserSerializer"  # Nome único para evitar conflito com Djoser

class UserDetailSerializer(UserSerializer):
    """Serializador detalhado para usuário com informações adicionais"""
    full_name = serializers.CharField(read_only=True)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['full_name', 'is_active', 'last_login']

class UserCreateSerializer(serializers.ModelSerializer):
    """Serializador para criação de usuário com validação de senha"""
    password = serializers.CharField(write_only=True, required=True)
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm',
                  'first_name', 'last_name', 'avatar', 'bio', 'position']
        ref_name = "AccountsUserCreateSerializer"  # Nome único para evitar conflito com Djoser

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "As senhas não conferem."})

        try:
            validate_password(attrs['password'])
        except ValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class PasswordChangeSerializer(serializers.Serializer):
    """Serializador para alteração de senha"""
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password_confirm = serializers.CharField(required=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Senha atual incorreta.")
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "As novas senhas não conferem."})

        try:
            validate_password(attrs['new_password'])
        except ValidationError as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})

        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class UserSettingsSerializer(serializers.ModelSerializer):
    """Serializador para as configurações do usuário"""

    class Meta:
        model = UserSettings
        exclude = ['user', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class UserSettingsDetailSerializer(serializers.ModelSerializer):
    """Serializador detalhado para as configurações do usuário"""

    class Meta:
        model = UserSettings
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']