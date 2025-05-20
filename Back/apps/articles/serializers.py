from rest_framework import serializers
from .models import Article, Tag, Comment
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from apps.categories.serializers import CategorySerializer
from apps.categories.models import Category
import requests
import logging
from django.conf import settings

User = get_user_model()
logger = logging.getLogger(__name__)

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']



class ArticleSerializer(serializers.ModelSerializer):
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
            'tag_names', 'cover_image', 'is_favorite'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'views_count', 'is_favorite']

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


class CommentSerializer(serializers.ModelSerializer):
    replies = serializers.SerializerMethodField()
    captcha_token = serializers.CharField(write_only=True, required=False)
    depth = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Comment
        fields = [
            'id', 'article', 'article_slug', 'name', 'email', 'text',
            'created_at', 'updated_at', 'is_approved', 'is_spam',
            'parent', 'replies', 'captcha_token', 'depth'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_approved', 'is_spam', 'ip_address', 'user_agent']

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []

    def get_depth(self, obj):
        return obj.get_depth()

    def validate(self, data):
        # Validar campos obrigatórios
        if not data.get('name'):
            raise serializers.ValidationError({"name": "O nome é obrigatório."})

        if not data.get('text'):
            raise serializers.ValidationError({"text": "O texto do comentário é obrigatório."})

        # Validar captcha se estiver configurado
        captcha_token = data.get('captcha_token')
        if hasattr(settings, 'RECAPTCHA_SECRET_KEY') and settings.RECAPTCHA_SECRET_KEY:
            if not captcha_token:
                raise serializers.ValidationError({"captcha_token": "Verificação de captcha é obrigatória."})

            # Verificar o token do captcha
            try:
                response = requests.post(
                    'https://www.google.com/recaptcha/api/siteverify',
                    data={
                        'secret': settings.RECAPTCHA_SECRET_KEY,
                        'response': captcha_token
                    }
                )
                result = response.json()

                if not result.get('success', False):
                    logger.warning(f"Falha na validação do captcha: {result}")
                    raise serializers.ValidationError({"captcha_token": "Falha na verificação do captcha."})
            except Exception as e:
                logger.error(f"Erro ao verificar captcha: {str(e)}")
                # Em ambiente de desenvolvimento, podemos permitir mesmo com erro
                if not settings.DEBUG:
                    raise serializers.ValidationError({"captcha_token": "Erro ao verificar captcha."})

        # Validar hierarquia de comentários (máximo de 3 níveis)
        parent = data.get('parent')
        if parent:
            depth = parent.get_depth()
            if depth >= 2:  # Permitir até 3 níveis (0, 1, 2)
                raise serializers.ValidationError({"parent": "Limite de profundidade de comentários excedido."})

        return data

    def create(self, validated_data):
        # Remover o token do captcha antes de salvar
        validated_data.pop('captcha_token', None)

        # Obter informações do request
        request = self.context.get('request')
        if request:
            validated_data['ip_address'] = self.get_client_ip(request)
            validated_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')

        # Se article_slug for fornecido, mas article não, tente encontrar o artigo pelo slug
        article_slug = validated_data.get('article_slug')
        if article_slug and not validated_data.get('article'):
            try:
                article = Article.objects.get(slug=article_slug)
                validated_data['article'] = article
            except Article.DoesNotExist:
                pass

        return super().create(validated_data)

    def get_client_ip(self, request):
        """Obtém o endereço IP real do cliente, considerando proxies"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
