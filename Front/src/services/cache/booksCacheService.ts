/**
 * Serviço de cache para livros usando o sistema de cache unificado
 */
import { Book } from '../api/books.service';
import { createDomainCache, CacheManager } from '../../utils/cacheManager';

// Criar cache específico para livros
const booksCache: CacheManager = createDomainCache('books', {
  expirationTime: 5 * 60 * 1000 // 5 minutos
});

// Chaves de cache
const KEYS = {
  BOOK: (slug: string) => `book_${slug}`,
  BOOKS_LIST: 'books_list',
  PAGINATED: (params: string) => `paginated_${params}`,
  FEATURED: 'featured',
  POPULAR: 'popular',
  RECENT: 'recent'
};

/**
 * Gera uma chave de cache para resultados paginados
 */
export const getPaginatedCacheKey = (
  page: number,
  search?: string,
  hasAudio?: boolean,
  ordering?: string
): string => {
  return KEYS.PAGINATED(
    `page=${page}|search=${search || ''}|hasAudio=${hasAudio || ''}|ordering=${ordering || ''}`
  );
};

/**
 * Obtém um livro do cache
 */
export const getCachedBook = (slug: string): Book | null => {
  return booksCache.get<Book>(KEYS.BOOK(slug));
};

/**
 * Armazena um livro no cache
 */
export const cacheBook = (book: Book): void => {
  if (!book || !book.slug) {
    return;
  }
  
  booksCache.set<Book>(KEYS.BOOK(book.slug), book);
};

/**
 * Obtém uma lista de livros do cache
 */
export const getCachedBooks = (cacheKey: string): Book[] | null => {
  return booksCache.get<Book[]>(cacheKey);
};

/**
 * Armazena uma lista de livros no cache
 */
export const cacheBooks = (books: Book[], cacheKey: string): void => {
  if (!books || !Array.isArray(books)) {
    return;
  }
  
  booksCache.set<Book[]>(cacheKey, books);
};

/**
 * Obtém livros em destaque do cache
 */
export const getCachedFeaturedBooks = (): Book[] | null => {
  return booksCache.get<Book[]>(KEYS.FEATURED);
};

/**
 * Armazena livros em destaque no cache
 */
export const cacheFeaturedBooks = (books: Book[]): void => {
  booksCache.set<Book[]>(KEYS.FEATURED, books);
};

/**
 * Obtém livros populares do cache
 */
export const getCachedPopularBooks = (): Book[] | null => {
  return booksCache.get<Book[]>(KEYS.POPULAR);
};

/**
 * Armazena livros populares no cache
 */
export const cachePopularBooks = (books: Book[]): void => {
  booksCache.set<Book[]>(KEYS.POPULAR, books);
};

/**
 * Obtém livros recentes do cache
 */
export const getCachedRecentBooks = (): Book[] | null => {
  return booksCache.get<Book[]>(KEYS.RECENT);
};

/**
 * Armazena livros recentes no cache
 */
export const cacheRecentBooks = (books: Book[]): void => {
  booksCache.set<Book[]>(KEYS.RECENT, books);
};

/**
 * Obtém resultados paginados do cache
 */
export const getCachedPaginatedBooks = (cacheKey: string): any | null => {
  return booksCache.get(cacheKey);
};

/**
 * Armazena resultados paginados no cache
 */
export const cachePaginatedBooks = (data: any, cacheKey: string): void => {
  if (!data) {
    return;
  }
  
  booksCache.set(cacheKey, data);
};

/**
 * Limpa o cache de um livro específico
 */
export const invalidateBookCache = (slug: string): void => {
  booksCache.remove(KEYS.BOOK(slug));
};

/**
 * Limpa todo o cache de livros
 */
export const clearBooksCache = (): void => {
  booksCache.clear();
};

// Exportar o serviço completo
const booksCacheService = {
  getPaginatedCacheKey,
  getCachedBook,
  cacheBook,
  getCachedBooks,
  cacheBooks,
  getCachedFeaturedBooks,
  cacheFeaturedBooks,
  getCachedPopularBooks,
  cachePopularBooks,
  getCachedRecentBooks,
  cacheRecentBooks,
  getCachedPaginatedBooks,
  cachePaginatedBooks,
  invalidateBookCache,
  clearBooksCache
};

export default booksCacheService;
