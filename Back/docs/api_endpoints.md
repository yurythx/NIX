# Documentação dos Endpoints da API Viixen

Este documento descreve os principais endpoints disponíveis na API Viixen.

## Autenticação

Para detalhes sobre autenticação, consulte o [Guia de Autenticação](authentication.md).

## Categorias

### Listar Categorias

```
GET /api/v1/categories/
```

**Parâmetros de consulta:**
- `search`: Filtrar por nome ou descrição
- `page`: Número da página
- `page_size`: Tamanho da página

**Resposta (200 OK):**
```json
{
  "count": 10,
  "next": "http://127.0.0.1:8000/api/v1/categories/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Tecnologia",
      "slug": "tecnologia",
      "description": "Artigos sobre tecnologia"
    },
    ...
  ]
}
```

### Obter Categoria por Slug

```
GET /api/v1/categories/{slug}/
```

**Resposta (200 OK):**
```json
{
  "id": 1,
  "name": "Tecnologia",
  "slug": "tecnologia",
  "description": "Artigos sobre tecnologia"
}
```

## Artigos

### Listar Artigos

```
GET /api/v1/articles/articles/
```

**Parâmetros de consulta:**
- `search`: Filtrar por título ou conteúdo
- `category__slug`: Filtrar por slug da categoria
- `tags__slug`: Filtrar por slug da tag
- `featured`: Filtrar por artigos em destaque (true/false)
- `ordering`: Ordenar por campo (ex: -created_at, title)
- `page`: Número da página
- `page_size`: Tamanho da página
- `nocache`: Ignorar cache (true/false)

**Resposta (200 OK):**
```json
{
  "count": 25,
  "next": "http://127.0.0.1:8000/api/v1/articles/articles/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Título do Artigo",
      "slug": "titulo-do-artigo",
      "content": "Conteúdo do artigo...",
      "category": {
        "id": 1,
        "name": "Tecnologia",
        "slug": "tecnologia"
      },
      "tags": [
        {
          "id": 1,
          "name": "Python",
          "slug": "python"
        }
      ],
      "created_at": "2023-01-01T12:00:00Z",
      "updated_at": "2023-01-02T12:00:00Z",
      "views_count": 100,
      "is_favorite": false
    },
    ...
  ]
}
```

### Obter Artigo por Slug

```
GET /api/v1/articles/articles/{slug}/
```

**Resposta (200 OK):**
```json
{
  "id": 1,
  "title": "Título do Artigo",
  "slug": "titulo-do-artigo",
  "content": "Conteúdo do artigo...",
  "category": {
    "id": 1,
    "name": "Tecnologia",
    "slug": "tecnologia"
  },
  "tags": [
    {
      "id": 1,
      "name": "Python",
      "slug": "python"
    }
  ],
  "created_at": "2023-01-01T12:00:00Z",
  "updated_at": "2023-01-02T12:00:00Z",
  "views_count": 100,
  "is_favorite": false
}
```

### Incrementar Visualizações

```
POST /api/v1/articles/articles/{slug}/increment_views/
```

**Resposta (200 OK):**
```json
{
  "status": "success",
  "views_count": 101
}
```

### Favoritar/Desfavoritar Artigo

```
POST /api/v1/articles/articles/{slug}/favorite/
```

**Resposta (200 OK):**
```json
{
  "status": "added to favorites",
  "is_favorite": true
}
```

### Listar Tags

```
GET /api/v1/articles/tags/
```

**Parâmetros de consulta:**
- `search`: Filtrar por nome
- `page`: Número da página
- `page_size`: Tamanho da página

**Resposta (200 OK):**
```json
{
  "count": 15,
  "next": "http://127.0.0.1:8000/api/v1/articles/tags/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Python",
      "slug": "python"
    },
    ...
  ]
}
```

## Livros

### Listar Livros

```
GET /api/v1/books/books/
```

**Parâmetros de consulta:**
- `search`: Filtrar por título ou descrição
- `has_audio`: Filtrar por livros com áudio (true/false)
- `ordering`: Ordenar por campo (ex: -created_at, title)
- `page`: Número da página
- `page_size`: Tamanho da página
- `nocache`: Ignorar cache (true/false)

**Exemplo de uso:**
```bash
# Listar todos os livros
curl -X GET http://127.0.0.1:8000/api/v1/books/books/

# Listar livros com áudio
curl -X GET http://127.0.0.1:8000/api/v1/books/books/?has_audio=true

# Buscar livros com a palavra "python" no título ou descrição
curl -X GET http://127.0.0.1:8000/api/v1/books/books/?search=python

# Listar livros ordenados por data de criação (mais recentes primeiro)
curl -X GET http://127.0.0.1:8000/api/v1/books/books/?ordering=-created_at

# Ignorar cache e obter dados atualizados
curl -X GET http://127.0.0.1:8000/api/v1/books/books/?nocache=true
```

**Resposta (200 OK):**
```json
{
  "count": 10,
  "next": "http://127.0.0.1:8000/api/v1/books/books/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Título do Livro",
      "slug": "titulo-do-livro",
      "description": "Descrição do livro...",
      "cover_image": "http://127.0.0.1:8000/media/covers/livro.jpg",
      "pdf_file": "http://127.0.0.1:8000/media/books/livro.pdf",
      "audio_file": "http://127.0.0.1:8000/media/audiobooks/livro.mp3",
      "created_at": "2023-01-01T12:00:00Z",
      "updated_at": "2023-01-02T12:00:00Z",
      "category": {
        "id": 1,
        "name": "Literatura",
        "slug": "literatura"
      }
    },
    ...
  ]
}
```

### Obter Livro por Slug

```
GET /api/v1/books/books/{slug}/
```

**Resposta (200 OK):**
```json
{
  "id": 1,
  "title": "Título do Livro",
  "slug": "titulo-do-livro",
  "description": "Descrição do livro...",
  "cover_image": "http://127.0.0.1:8000/media/covers/livro.jpg",
  "pdf_file": "http://127.0.0.1:8000/media/books/livro.pdf",
  "audio_file": "http://127.0.0.1:8000/media/audiobooks/livro.mp3",
  "created_at": "2023-01-01T12:00:00Z",
  "updated_at": "2023-01-02T12:00:00Z",
  "category": {
    "id": 1,
    "name": "Literatura",
    "slug": "literatura"
  }
}
```

## Mangás

### Listar Mangás

```
GET /api/v1/mangas/mangas/
```

**Parâmetros de consulta:**
- `search`: Filtrar por título ou descrição
- `ordering`: Ordenar por campo (ex: -created_at, title)
- `page`: Número da página
- `page_size`: Tamanho da página
- `nocache`: Ignorar cache (true/false)

**Resposta (200 OK):**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Título do Mangá",
      "slug": "titulo-do-manga",
      "description": "Descrição do mangá...",
      "cover_image": "http://127.0.0.1:8000/media/manga_covers/manga.jpg",
      "created_at": "2023-01-01T12:00:00Z",
      "updated_at": "2023-01-02T12:00:00Z",
      "chapters_count": 10
    },
    ...
  ]
}
```

### Obter Mangá por Slug

```
GET /api/v1/mangas/mangas/{slug}/
```

**Resposta (200 OK):**
```json
{
  "id": 1,
  "title": "Título do Mangá",
  "slug": "titulo-do-manga",
  "description": "Descrição do mangá...",
  "cover_image": "http://127.0.0.1:8000/media/manga_covers/manga.jpg",
  "created_at": "2023-01-01T12:00:00Z",
  "updated_at": "2023-01-02T12:00:00Z",
  "chapters_count": 10,
  "chapters": [
    {
      "id": 1,
      "number": 1,
      "title": "Capítulo 1",
      "created_at": "2023-01-01T12:00:00Z"
    },
    ...
  ]
}
```

### Listar Capítulos

```
GET /api/v1/mangas/chapters/
```

**Parâmetros de consulta:**
- `manga`: Filtrar por ID do mangá
- `manga_slug`: Filtrar por slug do mangá
- `ordering`: Ordenar por campo (ex: number)
- `page`: Número da página
- `page_size`: Tamanho da página

**Resposta (200 OK):**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "manga": 1,
      "number": 1,
      "title": "Capítulo 1",
      "created_at": "2023-01-01T12:00:00Z",
      "updated_at": "2023-01-01T12:00:00Z"
    },
    ...
  ]
}
```

### Obter Capítulo por ID

```
GET /api/v1/mangas/chapters/{id}/
```

**Resposta (200 OK):**
```json
{
  "id": 1,
  "manga": {
    "id": 1,
    "title": "Título do Mangá",
    "slug": "titulo-do-manga"
  },
  "number": 1,
  "title": "Capítulo 1",
  "created_at": "2023-01-01T12:00:00Z",
  "updated_at": "2023-01-01T12:00:00Z",
  "pages": [
    {
      "id": 1,
      "number": 1,
      "image": "http://127.0.0.1:8000/media/manga_pages/page1.jpg"
    },
    ...
  ]
}
```
