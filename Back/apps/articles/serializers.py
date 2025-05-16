from rest_framework import serializers
from .models import Article, Comment, Tag
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from apps.categories.serializers import CategorySerializer
from apps.categories.models import Category

User = get_user_model()

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']

class RecursiveCommentSerializer(serializers.Serializer):
    """Para serializar recursivamente respostas dos comentários"""
    def to_representation(self, value):
        serializer = CommentSerializer(value, context=self.context)
        return serializer.data

class CommentSerializer(serializers.ModelSerializer):
    replies = RecursiveCommentSerializer(many=True, read_only=True)
    article_slug = serializers.CharField(write_only=True)
    parent_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    reply_count = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'name', 'email', 'text', 'created_at', 'updated_at',
            'replies', 'reply_count', 'parent', 'article_slug', 'parent_id',
            'is_approved', 'is_spam'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'parent', 'is_approved', 'is_spam']
        ref_name = "ArticlesCommentSerializer"

    def get_reply_count(self, obj):
        """Retorna o número de respostas aprovadas para este comentário."""
        return obj.replies.filter(is_approved=True, is_spam=False).count()

    def validate(self, data):
        article_slug = data.get('article_slug')
        parent_id = data.get('parent_id')

        # Validar que o artigo existe
        try:
            article = Article.objects.get(slug=article_slug)
        except Article.DoesNotExist:
            raise serializers.ValidationError({'article_slug': 'Artigo não encontrado.'})

        # Validar que o parent existe e pertence ao mesmo artigo
        if parent_id:
            try:
                parent = Comment.objects.get(id=parent_id)
                if parent.article.slug != article_slug:
                    raise serializers.ValidationError({'parent_id': 'O comentário pai deve pertencer ao mesmo artigo.'})
            except Comment.DoesNotExist:
                raise serializers.ValidationError({'parent_id': 'Comentário pai não encontrado.'})

        return data

    def create(self, validated_data):
        article_slug = validated_data.pop('article_slug')
        parent_id = validated_data.pop('parent_id', None)

        # Obter o artigo
        article = Article.objects.get(slug=article_slug)
        validated_data['article'] = article

        # Definir o comentário pai, se existir
        if parent_id:
            try:
                parent_comment = Comment.objects.get(id=parent_id)
                # Verificar se o comentário pai pertence ao mesmo artigo
                if parent_comment.article_id != article.id:
                    raise serializers.ValidationError({'parent_id': 'O comentário pai deve pertencer ao mesmo artigo.'})
                validated_data['parent'] = parent_comment
            except Comment.DoesNotExist:
                raise serializers.ValidationError({'parent_id': 'Comentário pai não encontrado.'})

        # Capturar informações do request, se disponível
        request = self.context.get('request')
        if request:
            # Capturar IP e User Agent
            validated_data['ip_address'] = self.get_client_ip(request)
            validated_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')

            # Verificar se o comentário deve ser aprovado automaticamente
            # Por padrão, todos os comentários são aprovados (is_approved=True)
            # Aqui podemos implementar regras para moderação automática

            # Exemplo: comentários com certas palavras podem ser marcados para moderação
            text = validated_data.get('text', '').lower()
            spam_words = ['spam', 'viagra', 'casino', 'http://', 'https://']  # Exemplo básico
            if any(word in text for word in spam_words):
                validated_data['is_approved'] = False
                validated_data['is_spam'] = True

        return super().create(validated_data)

    def get_client_ip(self, request):
        """Obtém o endereço IP real do cliente, considerando proxies."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class ArticleSerializer(serializers.ModelSerializer):
    comments = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )
    tags = TagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False,
        max_length=20  # Limitar a 20 tags por artigo
    )
    is_favorite = serializers.SerializerMethodField()
    cover_image = serializers.ImageField(required=False, allow_null=True)

    # Validação mais rigorosa para o título e conteúdo
    title = serializers.CharField(
        max_length=255,
        min_length=5,
        error_messages={
            'max_length': 'O título não pode ter mais de 255 caracteres.',
            'min_length': 'O título deve ter pelo menos 5 caracteres.',
            'blank': 'O título não pode estar em branco.',
            'required': 'O título é obrigatório.'
        }
    )

    content = serializers.CharField(
        min_length=10,
        error_messages={
            'min_length': 'O conteúdo deve ter pelo menos 10 caracteres.',
            'blank': 'O conteúdo não pode estar em branco.',
            'required': 'O conteúdo é obrigatório.'
        }
    )

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'content', 'created_at', 'updated_at',
            'views_count', 'featured', 'category', 'category_id', 'tags',
            'tag_names', 'comments', 'comments_count', 'cover_image', 'is_favorite'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'views_count', 'comments_count', 'is_favorite']

    def get_comments(self, obj):
        # Retornar apenas comentários de alto nível (sem parent)
        top_level_comments = obj.comments.filter(parent=None)
        return CommentSerializer(top_level_comments, many=True, context=self.context).data

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorites.filter(id=request.user.id).exists()
        return False

    def validate(self, data):
        """
        Validação adicional para o artigo
        """
        # Verificar se o título contém palavras proibidas
        title = data.get('title', '')
        content = data.get('content', '')

        # Lista de palavras proibidas (exemplo)
        forbidden_words = ['spam', 'propaganda', 'publicidade não autorizada']

        for word in forbidden_words:
            if word in title.lower():
                raise serializers.ValidationError({
                    'title': f'O título não pode conter a palavra "{word}".'
                })

            if word in content.lower():
                raise serializers.ValidationError({
                    'content': f'O conteúdo não pode conter a palavra "{word}".'
                })

        # Verificar se o conteúdo tem um tamanho razoável
        if len(content) > 100000:  # Limitar a 100.000 caracteres
            raise serializers.ValidationError({
                'content': 'O conteúdo é muito longo. O limite é de 100.000 caracteres.'
            })

        return data

    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])

        # Sanitizar dados antes de salvar
        if 'title' in validated_data:
            validated_data['title'] = self._sanitize_text(validated_data['title'])

        if 'content' in validated_data:
            validated_data['content'] = self._sanitize_text(validated_data['content'])

        article = super().create(validated_data)

        # Processar tags
        self._process_tags(article, tag_names)

        return article

    def _sanitize_text(self, text):
        """
        Sanitiza o texto removendo caracteres potencialmente perigosos
        """
        # Exemplo simples de sanitização
        # Em um caso real, você pode usar bibliotecas como bleach
        import re

        # Remover scripts e tags HTML potencialmente perigosas
        text = re.sub(r'<script.*?>.*?</script>', '', text, flags=re.DOTALL)
        text = re.sub(r'<iframe.*?>.*?</iframe>', '', text, flags=re.DOTALL)
        text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)

        return text

    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tag_names', None)

        # Sanitizar dados antes de atualizar
        if 'title' in validated_data:
            validated_data['title'] = self._sanitize_text(validated_data['title'])

        if 'content' in validated_data:
            validated_data['content'] = self._sanitize_text(validated_data['content'])

        article = super().update(instance, validated_data)

        # Processar tags apenas se foram fornecidas
        if tag_names is not None:
            # Limpar tags existentes
            article.tags.clear()
            # Adicionar novas tags
            self._process_tags(article, tag_names)

        return article

    def _process_tags(self, article, tag_names):
        for tag_name in tag_names:
            tag_name = tag_name.strip()
            if tag_name:
                tag, created = Tag.objects.get_or_create(
                    name__iexact=tag_name,
                    defaults={'name': tag_name}
                )
                article.tags.add(tag)
