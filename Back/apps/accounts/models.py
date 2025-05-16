from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid

class User(AbstractUser):
    """Modelo de usuário personalizado"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_("email address"), unique=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(blank=True)
    position = models.CharField(max_length=100, blank=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['username']

    def __str__(self):
        return self.username

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.username)

            # Garantir slug único
            original_slug = self.slug
            counter = 1
            while User.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1

        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username


class UserSettings(models.Model):
    """Modelo para armazenar as configurações do usuário"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Configurações de comentários
    require_comment_approval = models.BooleanField(default=False)
    allow_anonymous_comments = models.BooleanField(default=True)
    notify_on_new_comments = models.BooleanField(default=True)

    # Configurações de segurança
    two_factor_enabled = models.BooleanField(default=False)
    session_timeout = models.IntegerField(default=60)  # em minutos
    login_notifications = models.BooleanField(default=True)

    # Configurações de notificações
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=False)
    notify_on_new_articles = models.BooleanField(default=True)
    notify_on_replies = models.BooleanField(default=True)

    # Frequência do resumo: 'daily', 'weekly', 'never'
    DIGEST_FREQUENCY_CHOICES = [
        ('daily', 'Diariamente'),
        ('weekly', 'Semanalmente'),
        ('never', 'Nunca'),
    ]
    digest_frequency = models.CharField(
        max_length=10,
        choices=DIGEST_FREQUENCY_CHOICES,
        default='weekly'
    )

    # Configurações de conta
    display_name = models.CharField(max_length=100, blank=True)
    show_email = models.BooleanField(default=False)

    # Idioma: 'pt-BR', 'en-US', 'es'
    LANGUAGE_CHOICES = [
        ('pt-BR', 'Português (Brasil)'),
        ('en-US', 'English (US)'),
        ('es', 'Español'),
    ]
    language = models.CharField(
        max_length=10,
        choices=LANGUAGE_CHOICES,
        default='pt-BR'
    )

    # Tema: 'light', 'dark', 'sepia'
    THEME_CHOICES = [
        ('light', 'Claro'),
        ('dark', 'Escuro'),
        ('sepia', 'Sépia'),
    ]
    theme = models.CharField(
        max_length=10,
        choices=THEME_CHOICES,
        default='dark'
    )

    # Usar tema do sistema
    use_system_theme = models.BooleanField(default=False)

    # Cor do tema: 'blue', 'purple', 'green', 'red', 'orange'
    THEME_COLOR_CHOICES = [
        ('blue', 'Azul'),
        ('purple', 'Roxo'),
        ('green', 'Verde'),
        ('red', 'Vermelho'),
        ('orange', 'Laranja'),
    ]
    theme_color = models.CharField(
        max_length=10,
        choices=THEME_COLOR_CHOICES,
        default='blue'
    )

    class Meta:
        verbose_name = _('user settings')
        verbose_name_plural = _('user settings')

    def __str__(self):
        return f"Configurações de {self.user.username}"


@receiver(post_save, sender=User)
def create_user_settings(sender, instance, created, **kwargs):
    """Cria configurações para o usuário quando ele é criado"""
    if created:
        UserSettings.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_settings(sender, instance, **kwargs):
    """Salva as configurações do usuário quando ele é salvo"""
    try:
        instance.settings.save()
    except UserSettings.DoesNotExist:
        UserSettings.objects.create(user=instance)