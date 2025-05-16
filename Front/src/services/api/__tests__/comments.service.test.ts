import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import commentsService from '../comments.service';
import { API_BASE_URL, API_ENDPOINTS } from '../config';

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

describe('Comments Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    // Restore all mocks after each test
    jest.restoreAllMocks();
  });

  describe('getBookComments', () => {
    it('should fetch comments for a book successfully', async () => {
      // Mock data
      const mockComments = [
        {
          id: 1,
          content: 'Great book!',
          user: { id: 1, username: 'user1' },
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 2,
          content: 'Loved it!',
          user: { id: 2, username: 'user2' },
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z'
        }
      ];
      const bookSlug = 'test-book';

      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComments,
        status: 200
      });

      // Call the function
      const result = await commentsService.getBookComments(bookSlug);

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_ENDPOINTS.BOOKS.BOOK_COMMENTS(bookSlug)}`,
        expect.objectContaining({
          method: 'GET'
        })
      );
      expect(result).toEqual(mockComments);
    });

    it('should handle API errors', async () => {
      // Mock fetch response for error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Server error' })
      });

      // Call the function
      const result = await commentsService.getBookComments('test-book');

      // Assertions
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle paginated response', async () => {
      // Mock paginated data
      const mockPaginatedComments = {
        count: 2,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            content: 'Great book!',
            user: { id: 1, username: 'user1' },
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          },
          {
            id: 2,
            content: 'Loved it!',
            user: { id: 2, username: 'user2' },
            created_at: '2023-01-02T00:00:00Z',
            updated_at: '2023-01-02T00:00:00Z'
          }
        ]
      };
      const bookSlug = 'test-book';

      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginatedComments,
        status: 200
      });

      // Call the function
      const result = await commentsService.getBookComments(bookSlug);

      // Assertions
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual(mockPaginatedComments.results);
    });

    it('should handle network errors', async () => {
      // Mock fetch to throw network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Call the function
      const result = await commentsService.getBookComments('test-book');

      // Assertions
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('createBookComment', () => {
    it('should create a comment successfully', async () => {
      // Mock data
      const mockComment = {
        id: 1,
        content: 'New comment',
        user: { id: 1, username: 'user1' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };
      const bookSlug = 'test-book';
      const commentData = { content: 'New comment' };

      // Mock localStorage getItem for token
      localStorage.setItem('access_token', 'fake-token');

      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComment,
        status: 201
      });

      // Call the function
      const result = await commentsService.createBookComment(bookSlug, commentData);

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_ENDPOINTS.BOOKS.BOOK_COMMENTS(bookSlug)}`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token'
          }),
          body: JSON.stringify(commentData)
        })
      );
      expect(result).toEqual(mockComment);
    });

    it('should throw an error when not authenticated', async () => {
      // Mock localStorage getItem to return null (no token)
      localStorage.setItem('access_token', null);

      // Call the function and expect it to throw
      await expect(commentsService.createBookComment('test-book', { content: 'Test' }))
        .rejects.toThrow('Usuário não autenticado');

      // Assertions
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Mock data
      const bookSlug = 'test-book';
      const commentData = { content: '' }; // Empty content to trigger validation error

      // Mock localStorage getItem for token
      localStorage.setItem('access_token', 'fake-token');

      // Mock fetch response for error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ content: ['This field may not be blank.'] })
      });

      // Call the function and expect it to throw
      await expect(commentsService.createBookComment(bookSlug, commentData))
        .rejects.toThrow();

      // Assertions
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('updateComment', () => {
    it('should update a comment successfully', async () => {
      // Mock data
      const mockComment = {
        id: 1,
        content: 'Updated comment',
        user: { id: 1, username: 'user1' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z'
      };
      const commentId = 1;
      const content = 'Updated comment';

      // Mock localStorage getItem for token
      localStorage.setItem('access_token', 'fake-token');

      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComment,
        status: 200
      });

      // Call the function
      const result = await commentsService.updateComment(commentId, content);

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_ENDPOINTS.COMMENTS.DETAIL(commentId)}`,
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token'
          }),
          body: JSON.stringify({ content })
        })
      );
      expect(result).toEqual(mockComment);
    });

    it('should throw an error when not authenticated', async () => {
      // Mock localStorage getItem to return null (no token)
      localStorage.setItem('access_token', null);

      // Call the function and expect it to throw
      await expect(commentsService.updateComment(1, 'Updated content'))
        .rejects.toThrow('Usuário não autenticado');

      // Assertions
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle permission denied error', async () => {
      // Mock data
      const commentId = 2;
      const content = 'Trying to update someone else\'s comment';

      // Mock localStorage getItem for token
      localStorage.setItem('access_token', 'fake-token');

      // Mock fetch response for permission error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'You do not have permission to perform this action.' })
      });

      // Call the function and expect it to throw
      await expect(commentsService.updateComment(commentId, content))
        .rejects.toThrow();

      // Assertions
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment successfully', async () => {
      // Mock data
      const commentId = 1;

      // Mock localStorage getItem for token
      localStorage.setItem('access_token', 'fake-token');

      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204
      });

      // Call the function
      await commentsService.deleteComment(commentId);

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_ENDPOINTS.COMMENTS.DETAIL(commentId)}`,
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token'
          })
        })
      );
    });

    it('should throw an error when not authenticated', async () => {
      // Mock localStorage getItem to return null (no token)
      localStorage.setItem('access_token', null);

      // Call the function and expect it to throw
      await expect(commentsService.deleteComment(1))
        .rejects.toThrow('Usuário não autenticado');

      // Assertions
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle not found error', async () => {
      // Mock data
      const commentId = 999; // Non-existent comment

      // Mock localStorage getItem for token
      localStorage.setItem('access_token', 'fake-token');

      // Mock fetch response for not found error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not found.' })
      });

      // Call the function and expect it to throw
      await expect(commentsService.deleteComment(commentId))
        .rejects.toThrow();

      // Assertions
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
