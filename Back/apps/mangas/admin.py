from django.contrib import admin
from .models import Manga, Chapter, Page

@admin.register(Manga)
class MangaAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'created_at')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}

@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ('manga', 'title', 'number', 'created_at')
    list_filter = ('manga',)
    search_fields = ('title', 'manga__title')

@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ('chapter', 'page_number')
    list_filter = ('chapter__manga',)
