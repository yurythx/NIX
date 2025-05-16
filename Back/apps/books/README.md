# API de Livros

Esta API permite gerenciar livros, incluindo a leitura de arquivos PDF.

## Modelos

### Book

| Campo       | Tipo      | Descrição                                |
|-------------|-----------|------------------------------------------|
| id          | Integer   | ID do livro                              |
| title       | String    | Título do livro                          |
| slug        | String    | Slug do livro (gerado automaticamente)   |
| description | Text      | Descrição do livro                       |
| cover_image | File      | Imagem de capa do livro                  |
| pdf_file    | File      | Arquivo PDF do livro                     |
| audio_file  | File      | Arquivo de áudio do livro (opcional)     |
| created_at  | DateTime  | Data de criação do livro                 |
| updated_at  | DateTime  | Data de atualização do livro             |

## Endpoints

### Livros

#### Listar todos os livros

```
GET /api/v1/books/books/
```

Retorna uma lista de todos os livros.

**Parâmetros de consulta:**
- `has_audio`: Filtrar por livros com áudio (`true` ou `false`)
- `search`: Pesquisar por título ou descrição
- `ordering`: Ordenar por campo (ex: `title`, `-created_at`)

**Resposta:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Livro de Teste",
      "slug": "livro-de-teste",
      "description": "Descrição do livro de teste",
      "cover_image": "http://127.0.0.1:8000/media/covers/test.pdf",
      "pdf_file": "http://127.0.0.1:8000/media/books/test.pdf",
      "audio_file": null,
      "created_at": "2025-05-12T13:11:47.550434-03:00",
      "updated_at": "2025-05-12T13:11:47.557063-03:00"
    }
  ]
}
```

#### Obter um livro específico

```
GET /api/v1/books/books/{slug}/
```

Retorna os detalhes de um livro específico.

**Resposta:**
```json
{
  "id": 1,
  "title": "Livro de Teste",
  "slug": "livro-de-teste",
  "description": "Descrição do livro de teste",
  "cover_image": "http://127.0.0.1:8000/media/covers/test.pdf",
  "pdf_file": "http://127.0.0.1:8000/media/books/test.pdf",
  "audio_file": null,
  "created_at": "2025-05-12T13:11:47.550434-03:00",
  "updated_at": "2025-05-12T13:11:47.557063-03:00"
}
```

#### Criar um novo livro

```
POST /api/v1/books/books/
```

Cria um novo livro.

**Corpo da requisição:**
```
Content-Type: multipart/form-data

title=Livro de Teste
description=Descrição do livro de teste
cover_image=@caminho/para/imagem.jpg
pdf_file=@caminho/para/arquivo.pdf
audio_file=@caminho/para/audio.mp3 (opcional)
```

**Resposta:**
```json
{
  "id": 1,
  "title": "Livro de Teste",
  "slug": "livro-de-teste",
  "description": "Descrição do livro de teste",
  "cover_image": "http://127.0.0.1:8000/media/covers/imagem.jpg",
  "pdf_file": "http://127.0.0.1:8000/media/books/arquivo.pdf",
  "audio_file": "http://127.0.0.1:8000/media/audiobooks/audio.mp3",
  "created_at": "2025-05-12T13:11:47.550434-03:00",
  "updated_at": "2025-05-12T13:11:47.557063-03:00"
}
```

#### Atualizar um livro

```
PUT /api/v1/books/books/{slug}/
```

Atualiza um livro existente.

**Corpo da requisição:**
```
Content-Type: multipart/form-data

title=Livro de Teste Atualizado
description=Descrição atualizada do livro de teste
cover_image=@caminho/para/nova_imagem.jpg
pdf_file=@caminho/para/novo_arquivo.pdf
audio_file=@caminho/para/novo_audio.mp3 (opcional)
```

**Resposta:**
```json
{
  "id": 1,
  "title": "Livro de Teste Atualizado",
  "slug": "livro-de-teste",
  "description": "Descrição atualizada do livro de teste",
  "cover_image": "http://127.0.0.1:8000/media/covers/nova_imagem.jpg",
  "pdf_file": "http://127.0.0.1:8000/media/books/novo_arquivo.pdf",
  "audio_file": "http://127.0.0.1:8000/media/audiobooks/novo_audio.mp3",
  "created_at": "2025-05-12T13:11:47.550434-03:00",
  "updated_at": "2025-05-12T13:15:47.557063-03:00"
}
```

#### Excluir um livro

```
DELETE /api/v1/books/books/{slug}/
```

Exclui um livro existente.

**Resposta:**
```
Status: 204 No Content
```

### Leitura de PDF

#### Ler o conteúdo do PDF como texto

```
GET /api/v1/books/books/{slug}/read_pdf/
```

Retorna o conteúdo do PDF como texto.

**Parâmetros de consulta:**
- `page`: Número da página a ser lida (padrão: 1)

**Resposta:**
```json
{
  "total_pages": 1,
  "current_page": 1,
  "text": "Este é um arquivo PDF de teste válido.\n",
  "metadata": {
    "author": "Autor do PDF",
    "title": "Título do PDF"
  },
  "file_name": "test_valid.pdf"
}
```

#### Obter a estrutura do PDF

```
GET /api/v1/books/books/{slug}/pdf_structure/
```

Retorna a estrutura do PDF (sumário, metadados, etc.).

**Resposta:**
```json
{
  "total_pages": 1,
  "metadata": {
    "author": "Autor do PDF",
    "title": "Título do PDF"
  },
  "file_name": "test_valid.pdf",
  "file_size": 12345,
  "outline": [
    {
      "title": "Capítulo 1",
      "page": 1
    },
    {
      "title": "Capítulo 2",
      "page": 5
    }
  ]
}
```

#### Converter PDF em imagem

```
GET /api/v1/books/books/{slug}/pdf_as_images/
```

Converte uma página do PDF em imagem e retorna como base64.

**Parâmetros de consulta:**
- `page`: Número da página a ser convertida (padrão: 1)
- `format`: Formato da imagem (JPEG, PNG, TIFF) (padrão: JPEG)
- `dpi`: Resolução da imagem em DPI (padrão: 200)
- `quality`: Qualidade da imagem (para JPEG) (padrão: 85)
- `url_only`: Se true, retorna apenas o URL do PDF (padrão: false)

**Resposta (com url_only=true):**
```json
{
  "total_pages": 1,
  "pdf_url": "http://127.0.0.1:8000/media/books/test_valid.pdf",
  "message": "Use este URL para acessar o arquivo PDF diretamente. O frontend pode usar bibliotecas como PDF.js para renderizar o PDF."
}
```

**Resposta (com url_only=false):**
```json
{
  "total_pages": 1,
  "current_page": 1,
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
  "pdf_url": "http://127.0.0.1:8000/media/books/test_valid.pdf",
  "format": "JPEG",
  "dpi": 200,
  "quality": 85
}
```

### Áudio

#### Transmitir áudio

```
GET /api/v1/books/books/{slug}/stream_audio/
```

Transmite o arquivo de áudio de um livro.

**Parâmetros de consulta:**
- `speed`: Velocidade de reprodução (padrão: 1.0)

**Cabeçalhos:**
- `Range`: Intervalo de bytes para streaming (opcional)

**Resposta:**
```
Status: 206 Partial Content
Content-Type: audio/mpeg
Content-Length: 1024
Content-Range: bytes 0-1023/10240
X-Audio-Speed: 1.5
```

#### Obter informações do áudio

```
GET /api/v1/books/books/{slug}/audio_info/
```

Obtém informações sobre o arquivo de áudio de um livro.

**Resposta:**
```json
{
  "mime_type": "audio/mpeg",
  "file_size": 1048576,
  "duration": 180.5,
  "bitrate": 320000,
  "sample_rate": 44100,
  "channels": 2,
  "metadata": {
    "title": "Título do áudio",
    "artist": "Artista",
    "album": "Álbum"
  },
  "file_name": "audio.mp3"
}
```

#### Gerenciar marcadores de áudio

```
GET /api/v1/books/books/{slug}/audio_markers/
```

Obtém os marcadores de um arquivo de áudio.

**Resposta:**
```json
[
  {
    "time": 10.5,
    "label": "Início do capítulo 1"
  },
  {
    "time": 60.2,
    "label": "Início do capítulo 2"
  }
]
```

```
POST /api/v1/books/books/{slug}/audio_markers/
```

Cria marcadores para um arquivo de áudio.

**Corpo da requisição:**
```json
{
  "markers": [
    {
      "time": 10.5,
      "label": "Início do capítulo 1"
    },
    {
      "time": 60.2,
      "label": "Início do capítulo 2"
    }
  ]
}
```

**Resposta:**
```json
{
  "message": "Marcadores criados com sucesso"
}
```

## Requisitos

- Python 3.8+
- Django 4.2+
- Django REST Framework
- PyPDF2
- Pillow
- pdf2image (para conversão de PDF para imagem)
- Poppler (opcional, para melhor conversão de PDF para imagem)
- Mutagen (para processamento de arquivos de áudio)

## Instalação

1. Instale as dependências:
```
pip install PyPDF2 Pillow pdf2image mutagen
```

2. (Opcional) Instale o Poppler para melhor conversão de PDF para imagem:
   - Windows: Baixe do [poppler-windows](https://github.com/oschwartz10612/poppler-windows/releases/) e adicione ao PATH
   - Linux: `apt-get install poppler-utils`
   - macOS: `brew install poppler`

3. Adicione o app ao `INSTALLED_APPS` em `settings.py`:
```python
INSTALLED_APPS = [
    # ...
    'apps.books',
    # ...
]
```

4. Execute as migrações:
```
python manage.py makemigrations
python manage.py migrate
```

5. Configure o diretório de mídia em `settings.py`:
```python
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

6. Configure os diretórios de cache em `settings.py`:
```python
# Diretório de cache para PDFs
PDF_CACHE_DIR = os.path.join(MEDIA_ROOT, 'pdf_cache')

# Configuração de cache do Django (opcional, mas recomendado)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}
```

## Uso no Frontend

Para renderizar o PDF no frontend, você pode usar a biblioteca [PDF.js](https://mozilla.github.io/pdf.js/). Veja o exemplo de implementação no README principal.
