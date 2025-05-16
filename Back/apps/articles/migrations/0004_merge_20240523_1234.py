from django.db import migrations

class Migration(migrations.Migration):
    """
    Migração para mesclar as migrações conflitantes:
    - 0002_comment_improvements
    - 0003_article_cover_image_article_favorites
    """

    dependencies = [
        ('articles', '0002_comment_improvements'),
        ('articles', '0003_article_cover_image_article_favorites'),
    ]

    operations = [
        # Não são necessárias operações, apenas a mesclagem das dependências
    ]
