from django.db import models
from django.utils.text import slugify
from django.utils.crypto import get_random_string
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
    article = models.ForeignKey(Article, related_name='comments', on_delete=models.CASCADE, null=True, blank=True)
    article_slug = models.CharField(max_length=255, null=True, blank=True)
    name = models.CharField(max_length=100, default='Anônimo')
    email = models.EmailField(blank=True, null=True)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_approved = models.BooleanField(default=True)
    is_spam = models.BooleanField(default=False)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    captcha_token = models.CharField(max_length=255, blank=True, null=True, help_text="Token de verificação do captcha")
    ip_address = models.GenericIPAddressField(blank=True, null=True, help_text="Endereço IP do autor do comentário")
    user_agent = models.TextField(blank=True, null=True, help_text="User-Agent do navegador do autor")

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'comentário'
        verbose_name_plural = 'comentários'

    def __str__(self):
        return f"Comentário de {self.name} em {self.article.title if self.article else 'artigo desconhecido'}"

    def get_depth(self):
        """Retorna a profundidade do comentário na hierarquia"""
        depth = 0
        parent = self.parent
        while parent:
            depth += 1
            parent = parent.parent
        return depth
