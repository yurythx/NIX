# Uso do Componente de Comentários Unificado

Este documento demonstra como usar o componente de comentários unificado em diferentes tipos de conteúdo.

## Importação

```tsx
import UnifiedCommentList from '../../components/comments/UnifiedCommentList';
import { ContentType } from '../../services/api/unified-comments.service';
```

## Exemplos de Uso

### Para Artigos

```tsx
// Em um componente de artigo
import React from 'react';
import UnifiedCommentList from '../../components/comments/UnifiedCommentList';
import { ContentType } from '../../services/api/unified-comments.service';

interface ArticlePageProps {
  article: {
    id: number;
    slug: string;
    title: string;
    // outros campos do artigo
  };
}

const ArticlePage: React.FC<ArticlePageProps> = ({ article }) => {
  return (
    <div>
      {/* Conteúdo do artigo */}
      <h1>{article.title}</h1>
      {/* ... */}
      
      {/* Seção de comentários */}
      <UnifiedCommentList 
        contentType={ContentType.ARTICLE} 
        contentId={article.slug} 
        title="Comentários do Artigo"
      />
    </div>
  );
};

export default ArticlePage;
```

### Para Mangás

```tsx
// Em um componente de mangá
import React from 'react';
import UnifiedCommentList from '../../components/comments/UnifiedCommentList';
import { ContentType } from '../../services/api/unified-comments.service';

interface MangaPageProps {
  manga: {
    id: number;
    slug: string;
    title: string;
    // outros campos do mangá
  };
}

const MangaPage: React.FC<MangaPageProps> = ({ manga }) => {
  return (
    <div>
      {/* Conteúdo do mangá */}
      <h1>{manga.title}</h1>
      {/* ... */}
      
      {/* Seção de comentários */}
      <UnifiedCommentList 
        contentType={ContentType.MANGA} 
        contentId={manga.slug} 
        title="Comentários do Mangá"
      />
    </div>
  );
};

export default MangaPage;
```

### Para Capítulos de Mangá

```tsx
// Em um componente de capítulo de mangá
import React from 'react';
import UnifiedCommentList from '../../components/comments/UnifiedCommentList';
import { ContentType } from '../../services/api/unified-comments.service';

interface ChapterPageProps {
  chapter: {
    id: number;
    title: string;
    number: number;
    // outros campos do capítulo
  };
}

const ChapterPage: React.FC<ChapterPageProps> = ({ chapter }) => {
  return (
    <div>
      {/* Conteúdo do capítulo */}
      <h1>Capítulo {chapter.number}: {chapter.title}</h1>
      {/* ... */}
      
      {/* Seção de comentários */}
      <UnifiedCommentList 
        contentType={ContentType.CHAPTER} 
        contentId={chapter.id} 
        title="Comentários do Capítulo"
      />
    </div>
  );
};

export default ChapterPage;
```

### Para Livros

```tsx
// Em um componente de livro
import React from 'react';
import UnifiedCommentList from '../../components/comments/UnifiedCommentList';
import { ContentType } from '../../services/api/unified-comments.service';

interface BookPageProps {
  book: {
    id: number;
    slug: string;
    title: string;
    // outros campos do livro
  };
}

const BookPage: React.FC<BookPageProps> = ({ book }) => {
  return (
    <div>
      {/* Conteúdo do livro */}
      <h1>{book.title}</h1>
      {/* ... */}
      
      {/* Seção de comentários */}
      <UnifiedCommentList 
        contentType={ContentType.BOOK} 
        contentId={book.slug} 
        title="Comentários do Livro"
      />
    </div>
  );
};

export default BookPage;
```

## Personalização

O componente `UnifiedCommentList` aceita as seguintes propriedades:

- `contentType`: Tipo de conteúdo (ARTICLE, MANGA, CHAPTER, BOOK)
- `contentId`: ID ou slug do conteúdo
- `title`: Título da seção de comentários (opcional, padrão: "Comentários")
- `showForm`: Se deve mostrar o formulário de comentários (opcional, padrão: true)

Exemplo com personalização:

```tsx
<UnifiedCommentList 
  contentType={ContentType.BOOK} 
  contentId={book.slug} 
  title="Discussão" 
  showForm={isAuthenticated} // Mostrar formulário apenas para usuários autenticados
/>
```

## Benefícios da Abordagem Unificada

1. **Consistência**: Interface de usuário consistente para comentários em todos os tipos de conteúdo
2. **Manutenção**: Código centralizado facilita correções e melhorias
3. **Reutilização**: Menos código duplicado
4. **Flexibilidade**: Fácil adaptação para novos tipos de conteúdo no futuro
