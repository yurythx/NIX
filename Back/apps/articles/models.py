from django.db import models
from django.utils.text import slugify
from django.utils.crypto import get_random_string
from django.utils import timezone
from django.conf import settings
from apps.categories.models import Category

class Tag(models.Model):
    name = models.CharField(max_length=50)
    slug = models.SlugField(unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            # Gerar o slug base a partir do nome
            base_slug = slugify(self.name)

            # Verificar se já existe uma tag com esse slug
            if Tag.objects.filter(slug=base_slug).exists():
                # Se existir, adiciona um sufixo aleatório para garantir unicidade
                self.slug = f"{base_slug}-{get_random_string(4)}"
            else:
                self.slug = base_slug

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Article(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    views_count = models.PositiveIntegerField(default=0)
    featured = models.BooleanField(default=False)
    cover_image = models.ImageField(upload_to='articles/covers/', null=True, blank=True)
    category = models.ForeignKey(Category, related_name='articles', on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField(Tag, related_name='articles', blank=True)
    favorites = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='favorite_articles', blank=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            # Gerar o slug base a partir do título
            base_slug = slugify(self.title)

            # Verificar se já existe um artigo com esse slug
            if Article.objects.filter(slug=base_slug).exists():
                # Se existir, adiciona um sufixo aleatório para garantir unicidade
                self.slug = f"{base_slug}-{get_random_string(4)}"
            else:
                self.slug = base_slug

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    def increment_views(self):
        self.views_count += 1
        self.save(update_fields=['views_count'])
        return self.views_count

class Comment(models.Model):
    """
    Modelo para comentários em artigos.
    Permite comentários anônimos (sem usuário autenticado).
    """
    article = models.ForeignKey(Article, related_name='comments', on_delete=models.CASCADE)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='replies', on_delete=models.CASCADE)
    name = models.CharField(max_length=100, verbose_name='Nome')
    email = models.EmailField(null=True, blank=True, verbose_name='Email')
    text = models.TextField(verbose_name='Texto')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')

    # Campos para moderação
    is_approved = models.BooleanField(default=True, verbose_name='Aprovado')
    is_spam = models.BooleanField(default=False, verbose_name='Marcado como spam')

    # Campos para rastreamento
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='Endereço IP')
    user_agent = models.TextField(null=True, blank=True, verbose_name='User Agent')

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Comentário'
        verbose_name_plural = 'Comentários'

    def __str__(self):
        return f"{self.name} em {self.article.title}"

    def save(self, *args, **kwargs):
        # Validação para garantir que o parent seja do mesmo artigo
        if self.parent and self.parent.article_id != self.article_id:
            raise ValueError("O comentário pai deve pertencer ao mesmo artigo")

        super().save(*args, **kwargs)

    @property
    def get_replies(self):
        """Retorna todas as respostas a este comentário."""
        return Comment.objects.filter(parent=self, is_approved=True, is_spam=False)
