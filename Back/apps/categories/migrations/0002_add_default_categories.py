"""
Migração para adicionar categorias padrão
"""

from django.db import migrations

DEFAULT_CATEGORIES = [
    {
        'name': 'Tecnologia',
        'description': 'Artigos sobre tecnologia, programação e desenvolvimento de software.'
    },
    {
        'name': 'Mangás',
        'description': 'Mangás e quadrinhos japoneses.'
    },
    {
        'name': 'Livros',
        'description': 'Livros, e-books e publicações literárias.'
    },
    {
        'name': 'Tutoriais',
        'description': 'Guias e tutoriais sobre diversos assuntos.'
    },
    {
        'name': 'Notícias',
        'description': 'Notícias e atualizações sobre diversos temas.'
    },
    {
        'name': 'Entretenimento',
        'description': 'Conteúdo de entretenimento, jogos, filmes e séries.'
    },
]


def add_default_categories(apps, schema_editor):
    """
    Adiciona categorias padrão ao sistema
    """
    Category = apps.get_model('categories', 'Category')

    # Verificar se já existem categorias
    if Category.objects.count() > 0:
        return

    # Adicionar categorias padrão
    for category_data in DEFAULT_CATEGORIES:
        # Verificar se já existe uma categoria com o mesmo nome
        name = category_data['name']
        if not Category.objects.filter(name=name).exists():
            # Criar slug a partir do nome
            from django.utils.text import slugify
            from django.utils.crypto import get_random_string

            slug = slugify(name)
            # Verificar se o slug já existe
            if Category.objects.filter(slug=slug).exists():
                # Adicionar sufixo aleatório
                slug = f"{slug}-{get_random_string(4)}"

            # Criar a categoria
            Category.objects.create(
                name=name,
                description=category_data['description'],
                slug=slug
            )


def remove_default_categories(apps, schema_editor):
    """
    Remove as categorias padrão do sistema
    """
    Category = apps.get_model('categories', 'Category')

    # Remover categorias padrão
    for category_data in DEFAULT_CATEGORIES:
        Category.objects.filter(name=category_data['name']).delete()


class Migration(migrations.Migration):
    """
    Migração para adicionar categorias padrão
    """
    dependencies = [
        ('categories', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(add_default_categories, remove_default_categories),
    ]
