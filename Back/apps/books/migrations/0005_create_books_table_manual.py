# Generated manually

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('books', '0004_create_books_table'),
    ]

    operations = [
        migrations.RunSQL(
            """
            DROP TABLE IF EXISTS books_book;
            """,
            "SELECT 1;"
        ),
        migrations.RunSQL(
            """
            CREATE TABLE "books_book" (
                "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                "title" varchar(255) NOT NULL,
                "slug" varchar(255) NOT NULL UNIQUE,
                "description" text NOT NULL,
                "cover_image" varchar(100) NOT NULL,
                "pdf_file" varchar(100) NOT NULL,
                "audio_file" varchar(100) NULL,
                "created_at" datetime NOT NULL,
                "updated_at" datetime NOT NULL
            );
            """,
            "DROP TABLE IF EXISTS books_book;"
        ),
    ]
