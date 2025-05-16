"""
Serializadores para o app de livros
"""

from rest_framework import serializers
from .models import Book

class BookSerializer(serializers.ModelSerializer):
    """
    Serializador para o modelo Book
    """
    # Validação mais rigorosa para o título e descrição
    title = serializers.CharField(
        max_length=255,
        min_length=3,
        error_messages={
            'max_length': 'O título não pode ter mais de 255 caracteres.',
            'min_length': 'O título deve ter pelo menos 3 caracteres.',
            'blank': 'O título não pode estar em branco.',
            'required': 'O título é obrigatório.'
        }
    )

    description = serializers.CharField(
        min_length=10,
        required=False,
        allow_blank=True,
        error_messages={
            'min_length': 'A descrição deve ter pelo menos 10 caracteres quando fornecida.'
        }
    )

    # Validação para arquivos
    cover_image = serializers.ImageField(
        required=False,
        allow_null=True,
        error_messages={
            'invalid': 'O arquivo enviado não é uma imagem válida.'
        }
    )

    pdf_file = serializers.FileField(
        required=False,
        allow_null=True,
        error_messages={
            'invalid': 'O arquivo enviado não é um PDF válido.'
        }
    )

    audio_file = serializers.FileField(
        required=False,
        allow_null=True,
        error_messages={
            'invalid': 'O arquivo enviado não é um áudio válido.'
        }
    )

    class Meta:
        model = Book
        fields = [
            'id',
            'title',
            'slug',
            'description',
            'cover_image',
            'pdf_file',
            'audio_file',
            'created_at',
            'updated_at',
            'category',
            'views_count'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'views_count']

    def validate_pdf_file(self, value):
        """
        Validação personalizada para o arquivo PDF
        """
        if value:
            # Verificar o tamanho do arquivo (máximo 50MB)
            if value.size > 50 * 1024 * 1024:
                raise serializers.ValidationError(
                    'O arquivo PDF não pode ter mais de 50MB.'
                )

            # Verificar a extensão do arquivo
            if not value.name.lower().endswith('.pdf'):
                raise serializers.ValidationError(
                    'O arquivo deve ter a extensão .pdf'
                )

        return value

    def validate_audio_file(self, value):
        """
        Validação personalizada para o arquivo de áudio
        """
        if value:
            # Verificar o tamanho do arquivo (máximo 100MB)
            if value.size > 100 * 1024 * 1024:
                raise serializers.ValidationError(
                    'O arquivo de áudio não pode ter mais de 100MB.'
                )

            # Verificar a extensão do arquivo
            valid_extensions = ['.mp3', '.wav', '.ogg', '.m4a']
            if not any(value.name.lower().endswith(ext) for ext in valid_extensions):
                raise serializers.ValidationError(
                    f'O arquivo deve ter uma das seguintes extensões: {", ".join(valid_extensions)}'
                )

        return value

    def validate(self, data):
        """
        Validação adicional para o livro
        """
        # Verificar se o título contém palavras proibidas
        title = data.get('title', '')
        description = data.get('description', '')

        # Lista de palavras proibidas (exemplo)
        forbidden_words = ['spam', 'propaganda', 'publicidade não autorizada']

        for word in forbidden_words:
            if word in title.lower():
                raise serializers.ValidationError({
                    'title': f'O título não pode conter a palavra "{word}".'
                })

            if description and word in description.lower():
                raise serializers.ValidationError({
                    'description': f'A descrição não pode conter a palavra "{word}".'
                })

        return data