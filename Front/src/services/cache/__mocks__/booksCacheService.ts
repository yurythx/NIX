/**
 * Mock do serviço de cache para livros
 */

// Mock das funções de cache
const getPaginatedCacheKey = jest.fn((
  page: number,
  search?: string,
  hasAudio?: boolean,
  ordering?: string
): string => {
  return `page=${page}|search=${search || ''}|hasAudio=${hasAudio || ''}|ordering=${ordering || ''}`;
});

const getCachedBook = jest.fn(() => null);
const cacheBook = jest.fn();
const getCachedBooks = jest.fn(() => null);
const cacheBooks = jest.fn();
const getCachedFeaturedBooks = jest.fn(() => null);
const cacheFeaturedBooks = jest.fn();
const getCachedPopularBooks = jest.fn(() => null);
const cachePopularBooks = jest.fn();
const getCachedRecentBooks = jest.fn(() => null);
const cacheRecentBooks = jest.fn();
const getCachedPaginatedBooks = jest.fn(() => null);
const cachePaginatedBooks = jest.fn();
const invalidateBookCache = jest.fn();
const clearBooksCache = jest.fn();

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

export {
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
