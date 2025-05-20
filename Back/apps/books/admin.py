"""
Configuração do admin para o app de livros
"""

from django.contrib import admin
from .models import Book

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    """
    Configuração do admin para o modelo Book
    """
    list_display = ('title', 'created_at', 'has_audio')
    list_filter = ('created_at',)
    search_fields = ('title', 'description')
    readonly_fields = ('slug', 'created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'description')
        }),
        ('Arquivos', {
            'fields': ('cover_image', 'pdf_file', 'audio_file')
        }),
        ('Datas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def has_audio(self, obj):
        """
        Retorna se o livro possui arquivo de áudio
        """
        return bool(obj.audio_file)

    has_audio.boolean = True
    has_audio.short_description = 'Possui áudio'
