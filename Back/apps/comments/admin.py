"""
Configuração do admin para o app de comentários universal
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """Admin para o modelo de comentários universal"""
    list_display = [
        'id', 'user_display', 'content_type', 'object_link', 'short_content',
        'created_at', 'is_approved', 'is_spam', 'has_parent'
    ]
    list_filter = ['content_type', 'is_approved', 'is_spam', 'created_at']
    search_fields = ['content', 'user__username', 'name', 'email', 'ip_address']
    readonly_fields = ['created_at', 'updated_at', 'ip_address', 'user_agent']
    actions = ['approve_comments', 'reject_comments', 'mark_as_spam']
    date_hierarchy = 'created_at'
    list_per_page = 50

    fieldsets = [
        ('Informações do Comentário', {
            'fields': ('content', 'parent', 'is_approved', 'is_spam')
        }),
        ('Relacionamento', {
            'fields': ('content_type', 'object_id')
        }),
        ('Usuário', {
            'fields': ('user', 'name', 'email')
        }),
        ('Informações de Rastreamento', {
            'fields': ('ip_address', 'user_agent', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    ]

    def user_display(self, obj):
        """Exibe o usuário ou nome anônimo"""
        if obj.user:
            return format_html(
                '<a href="{}">{}</a>',
                reverse('admin:accounts_user_change', args=[obj.user.id]),
                obj.user.username
            )
        return obj.name or 'Anônimo'
    user_display.short_description = 'Usuário'

    def object_link(self, obj):
        """Exibe um link para o objeto relacionado"""
        try:
            model_admin_url = f'admin:{obj.content_type.app_label}_{obj.content_type.model}_change'
            url = reverse(model_admin_url, args=[obj.object_id])
            return format_html('<a href="{}">{} #{}</a>', url, obj.content_type.model, obj.object_id)
        except:
            return f'{obj.content_type.model} #{obj.object_id}'
    object_link.short_description = 'Objeto'

    def short_content(self, obj):
        """Exibe uma versão curta do conteúdo"""
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    short_content.short_description = 'Conteúdo'

    def has_parent(self, obj):
        """Indica se o comentário é uma resposta"""
        return obj.parent is not None
    has_parent.boolean = True
    has_parent.short_description = 'É resposta'

    def approve_comments(self, request, queryset):
        """Aprova os comentários selecionados"""
        queryset.update(is_approved=True, is_spam=False)
        self.message_user(request, f'{queryset.count()} comentários foram aprovados.')
    approve_comments.short_description = 'Aprovar comentários selecionados'

    def reject_comments(self, request, queryset):
        """Rejeita os comentários selecionados"""
        queryset.update(is_approved=False)
        self.message_user(request, f'{queryset.count()} comentários foram rejeitados.')
    reject_comments.short_description = 'Rejeitar comentários selecionados'

    def mark_as_spam(self, request, queryset):
        """Marca os comentários selecionados como spam"""
        queryset.update(is_approved=False, is_spam=True)
        self.message_user(request, f'{queryset.count()} comentários foram marcados como spam.')
    mark_as_spam.short_description = 'Marcar como spam'
