import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import booksService from '../books.service';
import { API_BASE_URL, API_ENDPOINTS } from '../config';

// Mock modules
jest.mock('../../../utils/errorHandler');
jest.mock('../../../services/cache/booksCacheService');

// Mock global fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    store
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Books Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    // Restore all mocks after each test
    jest.restoreAllMocks();
  });

  describe('getBooks', () => {
    it('should fetch books successfully', async () => {
      // Mock data
      const mockBooks = [
        { id: 1, title: 'Book 1', slug: 'book-1', description: 'Description 1', category: 1 },
        { id: 2, title: 'Book 2', slug: 'book-2', description: 'Description 2', category: 2 }
      ];

      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBooks,
        status: 200
      });

      // Call the function
      const result = await booksService.getBooks();

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_ENDPOINTS.BOOKS.BASE}books/`,
        expect.objectContaining({
          method: 'GET'
        })
      );
      expect(result).toEqual(mockBooks);
    });

    it('should handle API errors', async () => {
      // Mock fetch response for error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Server error' })
      });

      // Call the function
      const result = await booksService.getBooks();

      // Assertions
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle network errors', async () => {
      // Mock fetch to throw network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Call the function
      const result = await booksService.getBooks();

      // Assertions
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle paginated response', async () => {
      // Mock paginated data
      const mockPaginatedBooks = {
        count: 2,
        next: null,
        previous: null,
        results: [
          { id: 1, title: 'Book 1', slug: 'book-1', description: 'Description 1', category: 1 },
          { id: 2, title: 'Book 2', slug: 'book-2', description: 'Description 2', category: 2 }
        ]
      };

      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginatedBooks,
        status: 200
      });

      // Call the function
      const result = await booksService.getBooks();

      // Assertions
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual(mockPaginatedBooks.results);
    });
  });

  describe('getBookBySlug', () => {
    it('should fetch a book by slug successfully', async () => {
      // Mock data
      const slug = 'test-book';
      const mockBook = { 
        id: 1, 
        title: 'Test Book', 
        slug, 
        description: 'Test description',
        cover: 'cover.jpg',
        has_audio: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        category: 1
      };

      // Mock cache service to return null (cache miss)
      const booksCacheService = require('../../../services/cache/booksCacheService').default;
      booksCacheService.getCachedBook.mockReturnValueOnce(null);

      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBook,
        status: 200
      });

      // Call the function
      const result = await booksService.getBookBySlug(slug);

      // Assertions
      expect(booksCacheService.getCachedBook).toHaveBeenCalledWith(slug);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_ENDPOINTS.BOOKS.DETAIL(slug)}`,
        expect.objectContaining({
          method: 'GET'
        })
      );
      expect(booksCacheService.cacheBook).toHaveBeenCalledWith(mockBook);
      expect(result).toEqual(mockBook);
    });

    it('should return cached book if available', async () => {
      // Mock data
      const slug = 'cached-book';
      const mockBook = { 
        id: 2, 
        title: 'Cached Book', 
        slug, 
        description: 'Cached description',
        cover: 'cached-cover.jpg',
        has_audio: false,
        created_at: '2023-01-02T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        category: 2
      };

      // Mock cache service to return the book (cache hit)
      const booksCacheService = require('../../../services/cache/booksCacheService').default;
      booksCacheService.getCachedBook.mockReturnValueOnce(mockBook);

      // Call the function
      const result = await booksService.getBookBySlug(slug);

      // Assertions
      expect(booksCacheService.getCachedBook).toHaveBeenCalledWith(slug);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result).toEqual(mockBook);
    });

    it('should bypass cache when noCache is true', async () => {
      // Mock data
      const slug = 'fresh-book';
      const mockBook = { 
        id: 3, 
        title: 'Fresh Book', 
        slug, 
        description: 'Fresh description',
        cover: 'fresh-cover.jpg',
        has_audio: true,
        created_at: '2023-01-03T00:00:00Z',
        updated_at: '2023-01-03T00:00:00Z',
        category: 3
      };

      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBook,
        status: 200
      });

      // Call the function with noCache=true
      const result = await booksService.getBookBySlug(slug, true);

      // Assertions
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual(mockBook);
    });

    it('should return null when book is not found', async () => {
      // Mock cache service to return null (cache miss)
      const booksCacheService = require('../../../services/cache/booksCacheService').default;
      booksCacheService.getCachedBook.mockReturnValueOnce(null);

      // Mock fetch response for 404
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not found' })
      });

      // Call the function
      const result = await booksService.getBookBySlug('non-existent');

      // Assertions
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('getPaginatedBooks', () => {
    it('should fetch paginated books with correct parameters', async () => {
      // Mock data
      const page = 2;
      const searchTerm = 'test';
      const hasAudio = true;
      const ordering = '-created_at';
      
      const mockPaginatedBooks = {
        count: 10,
        next: 'page=3',
        previous: 'page=1',
        results: [
          { id: 3, title: 'Book 3', slug: 'book-3', description: 'Description 3', category: 1 },
          { id: 4, title: 'Book 4', slug: 'book-4', description: 'Description 4', category: 2 }
        ]
      };

      // Mock cache service to return null (cache miss)
      const booksCacheService = require('../../../services/cache/booksCacheService').default;
      booksCacheService.getCachedPaginatedBooks.mockReturnValueOnce(null);
      booksCacheService.getPaginatedCacheKey.mockReturnValueOnce('test-cache-key');

      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginatedBooks,
        status: 200
      });

      // Call the function with parameters
      const result = await booksService.getPaginatedBooks(page, searchTerm, hasAudio, ordering);

      // Assertions
      expect(booksCacheService.getPaginatedCacheKey).toHaveBeenCalledWith(page, searchTerm, hasAudio, ordering);
      expect(booksCacheService.getCachedPaginatedBooks).toHaveBeenCalled();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${API_BASE_URL}${API_ENDPOINTS.BOOKS.BASE}books/?page=${page}`),
        expect.any(Object)
      );
      
      // Check URL parameters
      const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchUrl).toContain(`&search=${searchTerm}`);
      expect(fetchUrl).toContain(`&has_audio=${hasAudio}`);
      expect(fetchUrl).toContain(`&ordering=${ordering}`);
      
      expect(booksCacheService.cachePaginatedBooks).toHaveBeenCalledWith(mockPaginatedBooks, expect.any(String));
      expect(result).toEqual(mockPaginatedBooks);
    });

    it('should return cached paginated books if available', async () => {
      // Mock data
      const mockPaginatedBooks = {
        count: 10,
        next: 'page=2',
        previous: null,
        results: [
          { id: 1, title: 'Book 1', slug: 'book-1', description: 'Description 1', category: 1 },
          { id: 2, title: 'Book 2', slug: 'book-2', description: 'Description 2', category: 2 }
        ]
      };

      // Mock cache service to return the paginated books (cache hit)
      const booksCacheService = require('../../../services/cache/booksCacheService').default;
      booksCacheService.getCachedPaginatedBooks.mockReturnValueOnce(mockPaginatedBooks);
      booksCacheService.getPaginatedCacheKey.mockReturnValueOnce('test-cache-key');

      // Call the function
      const result = await booksService.getPaginatedBooks();

      // Assertions
      expect(booksCacheService.getPaginatedCacheKey).toHaveBeenCalled();
      expect(booksCacheService.getCachedPaginatedBooks).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result).toEqual(mockPaginatedBooks);
    });
  });

  describe('createBook', () => {
    it('should create a book successfully', async () => {
      // Mock data
      const bookData = {
        title: 'New Book',
        description: 'New Description',
        has_audio: false,
        category: 1
      };
      
      const mockCreatedBook = {
        id: 5,
        title: 'New Book',
        slug: 'new-book',
        description: 'New Description',
        has_audio: false,
        category: 1,
        created_at: '2023-01-05T00:00:00Z',
        updated_at: '2023-01-05T00:00:00Z'
      };

      // Mock localStorage getItem for token
      localStorage.setItem('access_token', 'fake-token');

      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedBook,
        status: 201
      });

      // Call the function
      const result = await booksService.createBook(bookData);

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_ENDPOINTS.BOOKS.BASE}books/`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token'
          })
        })
      );
      
      // Check that FormData was used
      const formData = (global.fetch as jest.Mock).mock.calls[0][1].body;
      expect(formData instanceof FormData).toBe(true);
      
      // Check that cache was cleared
      const booksCacheService = require('../../../services/cache/booksCacheService').default;
      expect(booksCacheService.clearBooksCache).toHaveBeenCalled();
      
      expect(result).toEqual(mockCreatedBook);
    });

    it('should throw an error when not authenticated', async () => {
      // Mock localStorage getItem to return null (no token)
      localStorage.setItem('access_token', null);

      // Call the function and expect it to throw
      await expect(booksService.createBook({ title: 'Test', description: 'Test' }))
        .rejects.toThrow('Usuário não autenticado');

      // Assertions
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('updateBook', () => {
    it('should update a book successfully', async () => {
      // Mock data
      const slug = 'existing-book';
      const bookData = {
        title: 'Updated Title',
        description: 'Updated Description'
      };
      
      const mockUpdatedBook = {
        id: 6,
        title: 'Updated Title',
        slug: 'existing-book',
        description: 'Updated Description',
        has_audio: true,
        category: 2,
        created_at: '2023-01-06T00:00:00Z',
        updated_at: '2023-01-06T01:00:00Z'
      };

      // Mock localStorage getItem for token
      localStorage.setItem('access_token', 'fake-token');

      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedBook,
        status: 200
      });

      // Call the function
      const result = await booksService.updateBook(slug, bookData);

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_ENDPOINTS.BOOKS.DETAIL(slug)}`,
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token'
          })
        })
      );
      
      // Check that FormData was used
      const formData = (global.fetch as jest.Mock).mock.calls[0][1].body;
      expect(formData instanceof FormData).toBe(true);
      
      // Check that cache was invalidated
      const booksCacheService = require('../../../services/cache/booksCacheService').default;
      expect(booksCacheService.invalidateBookCache).toHaveBeenCalledWith(slug);
      
      expect(result).toEqual(mockUpdatedBook);
    });
  });

  describe('deleteBook', () => {
    it('should delete a book successfully', async () => {
      // Mock data
      const slug = 'book-to-delete';

      // Mock localStorage getItem for token
      localStorage.setItem('access_token', 'fake-token');

      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204
      });

      // Call the function
      await booksService.deleteBook(slug);

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_ENDPOINTS.BOOKS.DETAIL(slug)}`,
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token'
          })
        })
      );
      
      // Check that cache was invalidated
      const booksCacheService = require('../../../services/cache/booksCacheService').default;
      expect(booksCacheService.invalidateBookCache).toHaveBeenCalledWith(slug);
    });
  });
});
