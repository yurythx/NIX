import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import authService from '../auth.service';
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

describe('Auth Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    // Restore all mocks after each test
    jest.restoreAllMocks();
  });

  describe('login', () => {
    it('should login successfully and store tokens', async () => {
      // Mock data
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = {
        access: 'fake-access-token',
        refresh: 'fake-refresh-token',
        user: {
          id: 1,
          email: 'test@example.com',
          username: 'testuser'
        }
      };

      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 200
      });

      // Call the function
      const result = await authService.login(credentials);

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(credentials)
        })
      );

      // Check if tokens were stored in localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', mockResponse.access);
      expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', mockResponse.refresh);
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user));

      // Check return value
      expect(result).toEqual(mockResponse);
    });

    it('should handle login failure with invalid credentials', async () => {
      // Mock data
      const credentials = { email: 'wrong@example.com', password: 'wrongpassword' };
      
      // Mock fetch response for error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid credentials' })
      });

      // Call the function and expect it to throw
      await expect(authService.login(credentials)).rejects.toThrow();

      // Check that localStorage was not called
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle network errors during login', async () => {
      // Mock data
      const credentials = { email: 'test@example.com', password: 'password123' };
      
      // Mock fetch to throw network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Call the function and expect it to throw
      await expect(authService.login(credentials)).rejects.toThrow('Network error');

      // Check that localStorage was not called
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Mock data
      const userData = { 
        email: 'new@example.com', 
        password: 'password123',
        username: 'newuser'
      };
      const mockResponse = {
        id: 2,
        email: 'new@example.com',
        username: 'newuser'
      };

      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 201
      });

      // Call the function
      const result = await authService.register(userData);

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(userData)
        })
      );

      // Check return value
      expect(result).toEqual(mockResponse);
    });

    it('should handle registration failure with existing email', async () => {
      // Mock data
      const userData = { 
        email: 'existing@example.com', 
        password: 'password123',
        username: 'existinguser'
      };
      
      // Mock fetch response for error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ email: ['User with this email already exists.'] })
      });

      // Call the function and expect it to throw
      await expect(authService.register(userData)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should clear tokens and user data from localStorage', () => {
      // Setup localStorage with tokens
      localStorage.setItem('access_token', 'fake-access-token');
      localStorage.setItem('refresh_token', 'fake-refresh-token');
      localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }));

      // Call the function
      authService.logout();

      // Assertions
      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('refreshToken', () => {
    it('should refresh the access token successfully', async () => {
      // Setup localStorage with refresh token
      localStorage.setItem('refresh_token', 'old-refresh-token');

      // Mock response
      const mockResponse = {
        access: 'new-access-token',
        refresh: 'new-refresh-token'
      };

      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 200
      });

      // Call the function
      const result = await authService.refreshToken();

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ refresh: 'old-refresh-token' })
        })
      );

      // Check if new tokens were stored
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', mockResponse.access);
      expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', mockResponse.refresh);

      // Check return value
      expect(result).toEqual(mockResponse);
    });

    it('should handle refresh token failure', async () => {
      // Setup localStorage with invalid refresh token
      localStorage.setItem('refresh_token', 'invalid-refresh-token');

      // Mock fetch response for error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Token is invalid or expired' })
      });

      // Call the function and expect it to throw
      await expect(authService.refreshToken()).rejects.toThrow();

      // Check that old token was not removed
      expect(localStorage.removeItem).not.toHaveBeenCalled();
    });

    it('should handle missing refresh token', async () => {
      // No refresh token in localStorage
      
      // Call the function and expect it to throw
      await expect(authService.refreshToken()).rejects.toThrow('No refresh token available');

      // Check that fetch was not called
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('getAccessToken', () => {
    it('should return the access token from localStorage', () => {
      // Setup localStorage with access token
      localStorage.setItem('access_token', 'fake-access-token');

      // Call the function
      const token = authService.getAccessToken();

      // Assertions
      expect(localStorage.getItem).toHaveBeenCalledWith('access_token');
      expect(token).toBe('fake-access-token');
    });

    it('should return null if no access token exists', () => {
      // Call the function
      const token = authService.getAccessToken();

      // Assertions
      expect(localStorage.getItem).toHaveBeenCalledWith('access_token');
      expect(token).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current user from localStorage', () => {
      // Setup localStorage with user data
      const userData = { id: 1, email: 'test@example.com', username: 'testuser' };
      localStorage.setItem('user', JSON.stringify(userData));

      // Call the function
      const user = authService.getCurrentUser();

      // Assertions
      expect(localStorage.getItem).toHaveBeenCalledWith('user');
      expect(user).toEqual(userData);
    });

    it('should return null if no user data exists', () => {
      // Call the function
      const user = authService.getCurrentUser();

      // Assertions
      expect(localStorage.getItem).toHaveBeenCalledWith('user');
      expect(user).toBeNull();
    });

    it('should handle invalid JSON in user data', () => {
      // Setup localStorage with invalid JSON
      localStorage.setItem('user', 'invalid-json');

      // Call the function
      const user = authService.getCurrentUser();

      // Assertions
      expect(localStorage.getItem).toHaveBeenCalledWith('user');
      expect(user).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if access token exists', () => {
      // Setup localStorage with access token
      localStorage.setItem('access_token', 'fake-access-token');

      // Call the function
      const isAuth = authService.isAuthenticated();

      // Assertions
      expect(isAuth).toBe(true);
    });

    it('should return false if no access token exists', () => {
      // Call the function
      const isAuth = authService.isAuthenticated();

      // Assertions
      expect(isAuth).toBe(false);
    });
  });
});
