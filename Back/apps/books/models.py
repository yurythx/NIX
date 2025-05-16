"""
Modelos para o app de livros
"""

from django.db import models
from django.utils.text import slugify
from django.utils import timezone
from apps.categories.models import Category

class Book(models.Model):
    """
    Modelo para livros
    """
    title = models.CharField(max_length=255, verbose_name="Título")
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(verbose_name="Descrição")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='books', verbose_name="Categoria")
    cover_image = models.FileField(upload_to='covers/', verbose_name="Capa")
    pdf_file = models.FileField(upload_to='books/', verbose_name="Arquivo PDF")
    audio_file = models.FileField(upload_to='audiobooks/', null=True, blank=True, verbose_name="Arquivo de Áudio")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Data de Criação")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data de Atualização")
    views_count = models.PositiveIntegerField(default=0, verbose_name="Contador de Visualizações")

    class Meta:
        verbose_name = "Livro"
        verbose_name_plural = "Livros"
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        """
        Sobrescreve o método save para gerar o slug automaticamente
        """
        if not self.slug:
            self.slug = slugify(self.title)

            # Verificar se o slug já existe e adicionar um sufixo se necessário
            original_slug = self.slug
            counter = 1
            while Book.objects.filter(slug=self.slug).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1

        super().save(*args, **kwargs)
