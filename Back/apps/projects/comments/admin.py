from django.contrib import admin
from .models import Comment

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'task', 'user', 'content', 'created_at', 'updated_at', 'is_edited']
    list_filter = ['created_at', 'updated_at', 'is_edited']
    search_fields = ['content', 'user__username', 'task__title']
    readonly_fields = ['created_at', 'updated_at']
