from django.db import models
from django.utils.text import slugify
from django.utils.crypto import get_random_string

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'category'
        verbose_name_plural = 'categories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            # Gerar o slug base a partir do nome
            base_slug = slugify(self.name)

            # Verificar se já existe uma categoria com esse slug
            if Category.objects.filter(slug=base_slug).exists():
                # Se existir, adiciona um sufixo aleatório para garantir unicidade
                self.slug = f"{base_slug}-{get_random_string(4)}"
            else:
                self.slug = base_slug

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
