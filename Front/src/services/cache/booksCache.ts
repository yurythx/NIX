/**
 * Serviço de cache para livros
 */
import { Book } from '../api/books.service';

// Tempo de expiração do cache em milissegundos (5 minutos)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Interface para os itens do cache
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// Cache para livros individuais
const bookCache = new Map<string, CacheItem<Book>>();

// Cache para listas de livros
const booksListCache = new Map<string, CacheItem<Book[]>>();

// Cache para resultados paginados
const paginatedCache = new Map<string, CacheItem<any>>();

/**
 * Gera uma chave de cache para resultados paginados
 */
export const getPaginatedCacheKey = (
  page: number,
  search?: string,
  hasAudio?: boolean,
  ordering?: string
): string => {
  return `page=${page}|search=${search || ''}|hasAudio=${hasAudio || ''}|ordering=${ordering || ''}`;
};

/**
 * Obtém um livro do cache
 */
export const getCachedBook = (slug: string): Book | null => {
  const cached = bookCache.get(slug);
  
  if (!cached) {
    return null;
  }
  
  // Verificar se o cache expirou
  if (Date.now() - cached.timestamp > CACHE_EXPIRATION) {
    bookCache.delete(slug);
    return null;
  }
  
  return cached.data;
};

/**
 * Armazena um livro no cache
 */
export const cacheBook = (book: Book): void => {
  if (!book || !book.slug) {
    return;
  }
  
  bookCache.set(book.slug, {
    data: book,
    timestamp: Date.now()
  });
};

/**
 * Obtém uma lista de livros do cache
 */
export const getCachedBooks = (cacheKey: string): Book[] | null => {
  const cached = booksListCache.get(cacheKey);
  
  if (!cached) {
    return null;
  }
  
  // Verificar se o cache expirou
  if (Date.now() - cached.timestamp > CACHE_EXPIRATION) {
    booksListCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
};

/**
 * Armazena uma lista de livros no cache
 */
export const cacheBooks = (books: Book[], cacheKey: string): void => {
  if (!books || !Array.isArray(books)) {
    return;
  }
  
  booksListCache.set(cacheKey, {
    data: books,
    timestamp: Date.now()
  });
};

/**
 * Obtém resultados paginados do cache
 */
export const getCachedPaginatedBooks = (cacheKey: string): any | null => {
  const cached = paginatedCache.get(cacheKey);
  
  if (!cached) {
    return null;
  }
  
  // Verificar se o cache expirou
  if (Date.now() - cached.timestamp > CACHE_EXPIRATION) {
    paginatedCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
};

/**
 * Armazena resultados paginados no cache
 */
export const cachePaginatedBooks = (data: any, cacheKey: string): void => {
  if (!data) {
    return;
  }
  
  paginatedCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

/**
 * Limpa o cache de um livro específico
 */
export const invalidateBookCache = (slug: string): void => {
  bookCache.delete(slug);
};

/**
 * Limpa todo o cache de livros
 */
export const clearBooksCache = (): void => {
  bookCache.clear();
  booksListCache.clear();
  paginatedCache.clear();
};

// Exportar o serviço completo
const booksCache = {
  getPaginatedCacheKey,
  getCachedBook,
  cacheBook,
  getCachedBooks,
  cacheBooks,
  getCachedPaginatedBooks,
  cachePaginatedBooks,
  invalidateBookCache,
  clearBooksCache
};

export default booksCache;
