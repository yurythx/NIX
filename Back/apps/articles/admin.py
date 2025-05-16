from django.contrib import admin
from .models import Article, Comment, Tag

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'created_at', 'views_count', 'featured', 'category')
    list_filter = ('featured', 'category', 'created_at')
    search_fields = ('title', 'content')
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ('tags',)
    date_hierarchy = 'created_at'

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('name', 'article', 'parent', 'created_at', 'is_approved', 'is_spam')
    list_filter = ('created_at', 'is_approved', 'is_spam')
    search_fields = ('name', 'email', 'text', 'article__title', 'ip_address')
    date_hierarchy = 'created_at'
    readonly_fields = ('ip_address', 'user_agent', 'created_at', 'updated_at')
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('article', 'parent', 'name', 'email', 'text')
        }),
        ('Status', {
            'fields': ('is_approved', 'is_spam')
        }),
        ('Informações de Rastreamento', {
            'fields': ('ip_address', 'user_agent', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['approve_comments', 'reject_comments', 'mark_as_spam']

    def approve_comments(self, request, queryset):
        updated = queryset.update(is_approved=True, is_spam=False)
        self.message_user(request, f'{updated} comentário(s) aprovado(s) com sucesso.')
    approve_comments.short_description = "Aprovar comentários selecionados"

    def reject_comments(self, request, queryset):
        updated = queryset.update(is_approved=False)
        self.message_user(request, f'{updated} comentário(s) rejeitado(s) com sucesso.')
    reject_comments.short_description = "Rejeitar comentários selecionados"

    def mark_as_spam(self, request, queryset):
        updated = queryset.update(is_approved=False, is_spam=True)
        self.message_user(request, f'{updated} comentário(s) marcado(s) como spam.')
    mark_as_spam.short_description = "Marcar comentários selecionados como spam"

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
