from django.db import models
from django.utils.text import slugify
from django.utils.crypto import get_random_string
from django.contrib.auth import get_user_model

User = get_user_model()

class Manga(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(blank=True)
    cover = models.ImageField(upload_to='covers/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    favorites = models.ManyToManyField(User, related_name='favorite_mangas', blank=True)

    # Campos opcionais para categorização
    genres = models.CharField(max_length=255, blank=True, help_text="Gêneros separados por vírgula")
    status = models.CharField(max_length=50, blank=True, choices=[
        ('ongoing', 'Em andamento'),
        ('completed', 'Completo'),
        ('hiatus', 'Em hiato'),
        ('cancelled', 'Cancelado'),
    ], default='ongoing')
    author = models.CharField(max_length=255, blank=True)
    views_count = models.PositiveIntegerField(default=0, verbose_name="Contador de Visualizações")

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            if Manga.objects.filter(slug=base_slug).exists():
                self.slug = f"{base_slug}-{get_random_string(4)}"
            else:
                self.slug = base_slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Chapter(models.Model):
    CHAPTER_TYPE_CHOICES = [
        ('images', 'Imagens'),
        ('pdf', 'PDF'),
    ]

    manga = models.ForeignKey(Manga, related_name='chapters', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    number = models.PositiveIntegerField()
    chapter_type = models.CharField(max_length=10, choices=CHAPTER_TYPE_CHOICES, default='images')
    pdf_file = models.FileField(upload_to='chapters/pdf/', null=True, blank=True)
    pdf_file_path = models.CharField(max_length=255, null=True, blank=True, help_text='Caminho para o arquivo PDF quando enviado em partes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['number']

    def __str__(self):
        return f"{self.manga.title} - Capítulo {self.number}"

    def clean(self):
        from django.core.exceptions import ValidationError
        from django.conf import settings
        import logging

        logger = logging.getLogger(__name__)
        logger.info(f"Validando capítulo: tipo={self.chapter_type}, pdf_file={bool(self.pdf_file)}, pdf_file_path={self.pdf_file_path}")

        # Validar capítulos do tipo PDF
        if self.chapter_type == 'pdf' and not (self.pdf_file or self.pdf_file_path):
            # Verificar se é uma atualização de um objeto existente
            if self.pk:
                # Se for uma atualização, verificar se já existe um arquivo no banco de dados
                try:
                    existing_chapter = Chapter.objects.get(pk=self.pk)
                    if not (existing_chapter.pdf_file or existing_chapter.pdf_file_path):
                        logger.warning("Aviso: Capítulo PDF sem arquivo ou caminho. Será necessário adicionar posteriormente.")
                except Chapter.DoesNotExist:
                    pass
            else:
                # Se for um novo capítulo, exibir um aviso
                logger.warning("Aviso: Novo capítulo PDF sem arquivo ou caminho. Será necessário adicionar posteriormente.")

        # Validar que capítulos do tipo imagens não têm arquivo PDF
        if self.chapter_type == 'images' and (self.pdf_file or self.pdf_file_path):
            logger.error("Erro de validação: Capítulo de imagens com arquivo PDF")
            raise ValidationError('Capítulos do tipo imagens não devem ter um arquivo PDF.')

        # Validar o tamanho do arquivo PDF (apenas se for um upload direto)
        if self.chapter_type == 'pdf' and self.pdf_file and not self.pdf_file_path:
            max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 104857600)  # 100MB padrão
            if self.pdf_file.size > max_size:
                logger.error(f"Erro de validação: Arquivo PDF excede o tamanho máximo ({self.pdf_file.size} > {max_size})")
                raise ValidationError(f'O arquivo PDF não pode exceder {max_size/1024/1024:.0f}MB.')

class Page(models.Model):
    chapter = models.ForeignKey(Chapter, related_name='pages', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='pages/')
    page_number = models.PositiveIntegerField()

    class Meta:
        ordering = ['page_number']

    def __str__(self):
        return f"{self.chapter} - Página {self.page_number}"

class ReadingProgress(models.Model):
    user = models.ForeignKey(User, related_name='reading_progress', on_delete=models.CASCADE)
    manga = models.ForeignKey(Manga, related_name='reading_progress', on_delete=models.CASCADE)
    chapter = models.ForeignKey(Chapter, related_name='reading_progress', on_delete=models.CASCADE)
    page = models.ForeignKey(Page, related_name='reading_progress', on_delete=models.CASCADE, null=True, blank=True)
    last_read = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'manga')

    def __str__(self):
        return f"{self.user.username} - {self.manga.title} - Capítulo {self.chapter.number}"

class Comment(models.Model):
    user = models.ForeignKey(User, related_name='manga_comments', on_delete=models.CASCADE)
    chapter = models.ForeignKey(Chapter, related_name='comments', on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comentário de {self.user.username} em {self.chapter}"

class UserStatistics(models.Model):
    user = models.OneToOneField(User, related_name='manga_statistics', on_delete=models.CASCADE)
    total_chapters_read = models.PositiveIntegerField(default=0)
    total_pages_read = models.PositiveIntegerField(default=0)
    reading_time_minutes = models.PositiveIntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Estatísticas de {self.user.username}"

class MangaView(models.Model):
    user = models.ForeignKey(User, related_name='manga_views', on_delete=models.CASCADE)
    manga = models.ForeignKey(Manga, related_name='views', on_delete=models.CASCADE)
    view_count = models.PositiveIntegerField(default=1)
    last_viewed = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'manga')

    def __str__(self):
        return f"{self.user.username} visualizou {self.manga.title} {self.view_count} vezes"