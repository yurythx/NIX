# Documentação de Arquitetura

## Visão Geral

O projeto Viixen segue uma arquitetura em camadas, implementando os padrões de Repository e Service para separar as responsabilidades e facilitar a manutenção e os testes.

## Camadas da Arquitetura

### 1. Camada de Apresentação (Views)

A camada de apresentação é responsável por receber as requisições HTTP, validar os dados e chamar os serviços apropriados. No contexto do Django REST Framework, esta camada é implementada através de ViewSets, APIViews e Serializers.

**Componentes:**
- **ViewSets**: Classes que definem as operações CRUD para um modelo específico
- **APIViews**: Classes que definem operações personalizadas
- **Serializers**: Classes que convertem objetos Python em JSON e vice-versa

### 2. Camada de Serviço (Services)

A camada de serviço é responsável por encapsular a lógica de negócios. Cada serviço utiliza um ou mais repositórios para acessar os dados.

**Componentes:**
- **BaseService**: Classe base com métodos comuns para todos os serviços
- **Serviços específicos**: Classes que implementam a lógica de negócios para um domínio específico

### 3. Camada de Acesso a Dados (Repositories)

A camada de acesso a dados é responsável por encapsular a lógica de acesso a dados. Cada repositório é especializado em um modelo específico.

**Componentes:**
- **BaseRepository**: Classe base com métodos comuns para todos os repositórios
- **Repositórios específicos**: Classes que implementam a lógica de acesso a dados para um modelo específico

### 4. Camada de Modelo (Models)

A camada de modelo é responsável por representar as entidades do domínio e mapear para tabelas no banco de dados. No contexto do Django, esta camada é implementada através de modelos.

**Componentes:**
- **Models**: Classes que representam as entidades do domínio

## Fluxo de Dados

1. O cliente envia uma requisição HTTP para o servidor
2. A requisição é roteada para a view apropriada
3. A view valida os dados da requisição
4. A view chama o serviço apropriado
5. O serviço implementa a lógica de negócios
6. O serviço chama o repositório para acessar os dados
7. O repositório acessa o modelo para realizar operações no banco de dados
8. O resultado é retornado para o serviço
9. O serviço processa o resultado e retorna para a view
10. A view serializa o resultado e retorna para o cliente

## Padrões de Design Implementados

### 1. Padrão de Repositório

O padrão de repositório encapsula a lógica de acesso a dados, fornecendo uma interface abstrata para as operações de CRUD (Create, Read, Update, Delete).

**Benefícios:**
- Separa a lógica de acesso a dados da lógica de negócios
- Facilita a manutenção e os testes
- Permite trocar a fonte de dados sem afetar a lógica de negócios

**Implementação:**
```python
class BaseRepository:
    def __init__(self, model_class):
        self.model_class = model_class

    def get_all(self):
        return self.model_class.objects.all()

    def get_by_id(self, id):
        try:
            return self.model_class.objects.get(pk=id)
        except self.model_class.DoesNotExist:
            return None
```

### 2. Padrão de Serviço

O padrão de serviço encapsula a lógica de negócios, fornecendo uma interface para as operações de negócios.

**Benefícios:**
- Separa a lógica de negócios da lógica de apresentação
- Facilita a reutilização de código
- Melhora a testabilidade

**Implementação:**
```python
class BaseService:
    def __init__(self, repository):
        self.repository = repository

    def get_all(self):
        return self.repository.get_all()

    def get_by_id(self, id):
        return self.repository.get_by_id(id)
```

### 3. Padrão Singleton

O padrão Singleton garante que uma classe tenha apenas uma instância e fornece um ponto de acesso global para essa instância.

**Benefícios:**
- Garante que uma classe tenha apenas uma instância
- Fornece um ponto de acesso global para essa instância
- Economiza recursos do sistema

**Implementação:**
```python
# Instâncias únicas dos repositórios (Singleton)
article_repository = ArticleRepository()
comment_repository = CommentRepository()

# Instâncias únicas dos serviços (Singleton)
article_service = ArticleService()
comment_service = CommentService()
```

## Estrutura de Diretórios

```
Back/
├── apps/                 # Apps Django
│   ├── accounts/         # App de contas de usuário
│   │   ├── models.py     # Modelos de usuário
│   │   ├── services.py   # Inicialização dos serviços
│   │   ├── views.py      # Views de usuário
│   │   └── ...
│   ├── articles/         # App de artigos
│   │   ├── models.py     # Modelos de artigo
│   │   ├── services.py   # Inicialização dos serviços
│   │   ├── views.py      # Views de artigo
│   │   └── ...
│   └── ...
├── core/                 # Configurações e módulos centrais
│   ├── repositories/     # Repositórios para acesso a dados
│   │   ├── base_repository.py    # Repositório base
│   │   ├── article_repository.py # Repositório de artigos
│   │   └── ...
│   ├── services/         # Serviços para lógica de negócios
│   │   ├── base_service.py       # Serviço base
│   │   ├── article_service.py    # Serviço de artigos
│   │   └── ...
│   └── ...
└── ...
```

## Exemplos de Uso

### Exemplo 1: Obter Artigos em Destaque

```python
# View
class ArticleViewSet(viewsets.ModelViewSet):
    @action(detail=False, methods=['get'])
    def featured(self, request):
        articles = article_service.get_featured_articles()
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)

# Serviço
class ArticleService(BaseService):
    def get_featured_articles(self):
        return self.repository.get_featured()

# Repositório
class ArticleRepository(BaseRepository):
    def get_featured(self):
        return self.model_class.objects.filter(featured=True)
```

### Exemplo 2: Criar um Comentário

```python
# View
class CommentViewSet(viewsets.ModelViewSet):
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        article_slug = serializer.validated_data.pop('article_slug')
        article = get_object_or_404(Article, slug=article_slug)
        
        comment = comment_service.create_comment(
            data=serializer.validated_data,
            article_id=article.id
        )
        
        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)

# Serviço
class CommentService(BaseService):
    def create_comment(self, data, article_id):
        return self.repository.create(
            article_id=article_id,
            text=data['text'],
            name=data.get('name', 'Anônimo'),
            email=data.get('email')
        )

# Repositório
class CommentRepository(BaseRepository):
    def create(self, **kwargs):
        return self.model_class.objects.create(**kwargs)
```
