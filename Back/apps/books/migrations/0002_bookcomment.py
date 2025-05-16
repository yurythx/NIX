"""
Migração para o modelo de comentários de livros
"""

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('books', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='BookComment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField(verbose_name='Conteúdo')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, verbose_name='Criado em')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
                ('is_approved', models.BooleanField(default=True, verbose_name='Aprovado')),
                ('is_spam', models.BooleanField(default=False, verbose_name='Marcado como spam')),
                ('book', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='books.book')),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='books.bookcomment')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='book_comments', to='auth.user')),
            ],
            options={
                'verbose_name': 'Comentário de Livro',
                'verbose_name_plural': 'Comentários de Livros',
                'ordering': ['-created_at'],
            },
        ),
    ]
