# Viixen Backend

Este é o backend do projeto Viixen, desenvolvido com Django e Django REST Framework.

## Arquitetura do Projeto

O projeto segue uma arquitetura em camadas, implementando os padrões de Repository e Service para separar as responsabilidades e facilitar a manutenção e os testes.

### Estrutura de Diretórios

```
Back/
├── apps/                 # Apps Django
│   ├── accounts/         # App de contas de usuário
│   ├── articles/         # App de artigos
│   ├── books/            # App de livros
│   ├── categories/       # App de categorias
│   └── mangas/           # App de mangás
├── core/                 # Configurações e módulos centrais
│   ├── repositories/     # Repositórios para acesso a dados
│   ├── services/         # Serviços para lógica de negócios
│   └── settings.py       # Configurações do Django
└── manage.py             # Script de gerenciamento do Django
```

### Padrões de Design Implementados

#### 1. Padrão de Repositório

O padrão de repositório encapsula a lógica de acesso a dados, fornecendo uma interface abstrata para as operações de CRUD (Create, Read, Update, Delete).

**Benefícios:**
- Separa a lógica de acesso a dados da lógica de negócios
- Facilita a manutenção e os testes
- Permite trocar a fonte de dados sem afetar a lógica de negócios

**Implementação:**
- `BaseRepository`: Classe base com métodos comuns para todos os repositórios
- Repositórios específicos: `ArticleRepository`, `UserRepository`, `CategoryRepository`, etc.

#### 2. Padrão de Serviço

O padrão de serviço encapsula a lógica de negócios, fornecendo uma interface para as operações de negócios.

**Benefícios:**
- Separa a lógica de negócios da lógica de apresentação
- Facilita a reutilização de código
- Melhora a testabilidade

**Implementação:**
- `BaseService`: Classe base com métodos comuns para todos os serviços
- Serviços específicos: `ArticleService`, `UserService`, `CategoryService`, etc.

### Fluxo de Dados

```
Cliente HTTP → Views → Serviços → Repositórios → Modelos → Banco de Dados
```

1. **Views (Controllers)**: Recebem as requisições HTTP, validam os dados e chamam os serviços apropriados
2. **Serviços**: Implementam a lógica de negócios e chamam os repositórios para acessar os dados
3. **Repositórios**: Acessam os modelos do Django para realizar operações no banco de dados
4. **Modelos**: Representam as entidades do domínio e são mapeados para tabelas no banco de dados

### Diagrama de Componentes

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Views    │────▶│  Serviços   │────▶│ Repositórios│────▶│   Modelos   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Serializers │     │Lógica de    │     │Acesso a     │     │Banco de     │
│             │     │Negócios     │     │Dados        │     │Dados        │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## Componentes Principais

### Repositórios

Os repositórios são responsáveis por encapsular a lógica de acesso a dados. Cada repositório é especializado em um modelo específico.

**Exemplo:**
```python
class ArticleRepository(BaseRepository):
    def get_featured(self) -> QuerySet:
        return self.model_class.objects.filter(featured=True)
```

### Serviços

Os serviços são responsáveis por encapsular a lógica de negócios. Cada serviço utiliza um ou mais repositórios para acessar os dados.

**Exemplo:**
```python
class ArticleService(BaseService):
    def get_featured_articles(self) -> QuerySet:
        return self.repository.get_featured()
```

### Views

As views são responsáveis por receber as requisições HTTP, validar os dados e chamar os serviços apropriados.

**Exemplo:**
```python
class ArticleViewSet(viewsets.ModelViewSet):
    @action(detail=True, methods=['post'])
    def increment_views(self, request, slug=None):
        article = self.get_object()
        article_service.view_article(article.id)
        return Response({
            'status': 'success',
            'views_count': article.views_count
        })
```

## Benefícios da Arquitetura

1. **Separação de Responsabilidades**: Cada componente tem uma responsabilidade clara e bem definida
2. **Testabilidade**: Facilita a escrita de testes unitários e de integração
3. **Manutenibilidade**: Facilita a manutenção e evolução do código
4. **Reutilização**: Facilita a reutilização de código em diferentes partes do sistema
5. **Escalabilidade**: Facilita a escalabilidade do sistema, permitindo que diferentes componentes sejam escalados independentemente

## Como Contribuir

1. Clone o repositório
2. Crie um ambiente virtual: `python -m venv env`
3. Ative o ambiente virtual: `source env/bin/activate` (Linux/Mac) ou `env\Scripts\activate` (Windows)
4. Instale as dependências: `pip install -r requirements.txt`
5. Execute as migrações: `python manage.py migrate`
6. Execute o servidor: `python manage.py runserver`

## API de Livros

A API de livros permite gerenciar livros, incluindo a leitura de arquivos PDF.

### Endpoints

#### Listar todos os livros

```
GET /api/v1/books/books/
```

Retorna uma lista de todos os livros.

#### Obter um livro específico

```
GET /api/v1/books/books/{slug}/
```

Retorna os detalhes de um livro específico.

#### Criar um novo livro

```
POST /api/v1/books/books/
```

Cria um novo livro. Os seguintes campos são obrigatórios:

- `title`: Título do livro
- `description`: Descrição do livro
- `cover_image`: Imagem de capa do livro (arquivo)
- `pdf_file`: Arquivo PDF do livro (arquivo)

O campo `audio_file` é opcional.

#### Atualizar um livro

```
PUT /api/v1/books/books/{slug}/
```

Atualiza um livro existente.

#### Excluir um livro

```
DELETE /api/v1/books/books/{slug}/
```

Exclui um livro existente.

### Leitura de PDF

#### Ler o conteúdo do PDF como texto

```
GET /api/v1/books/books/{slug}/read_pdf/
```

Retorna o conteúdo do PDF como texto. Parâmetros opcionais:

- `page`: Número da página a ser lida (padrão: 1)

Exemplo de resposta:

```json
{
  "total_pages": 1,
  "current_page": 1,
  "text": "Este é um arquivo PDF de teste válido.\n"
}
```

#### Obter o URL do PDF

```
GET /api/v1/books/books/{slug}/pdf_as_images/
```

Retorna o URL do PDF para ser renderizado no frontend.

Exemplo de resposta:

```json
{
  "total_pages": 1,
  "pdf_url": "http://127.0.0.1:8000/media/books/test_valid.pdf",
  "message": "Use este URL para acessar o arquivo PDF diretamente. O frontend pode usar bibliotecas como PDF.js para renderizar o PDF."
}
```

### Implementação no Frontend

Para renderizar o PDF no frontend, você pode usar a biblioteca [PDF.js](https://mozilla.github.io/pdf.js/). Exemplo de implementação:

```javascript
// Importar PDF.js
import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.js';

// Função para renderizar o PDF
async function renderPDF(pdfUrl, canvasId, pageNumber = 1) {
  try {
    // Carregar o PDF
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    // Obter a página
    const page = await pdf.getPage(pageNumber);

    // Configurar o canvas
    const canvas = document.getElementById(canvasId);
    const context = canvas.getContext('2d');

    // Configurar a escala
    const viewport = page.getViewport({ scale: 1.5 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Renderizar a página
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    await page.render(renderContext).promise;

    return {
      totalPages: pdf.numPages,
      currentPage: pageNumber
    };
  } catch (error) {
    console.error('Erro ao renderizar o PDF:', error);
    throw error;
  }
}

// Exemplo de uso
renderPDF('http://127.0.0.1:8000/media/books/test_valid.pdf', 'pdf-canvas')
  .then(result => {
    console.log(`Página ${result.currentPage} de ${result.totalPages}`);
  })
  .catch(error => {
    console.error('Erro:', error);
  });
```