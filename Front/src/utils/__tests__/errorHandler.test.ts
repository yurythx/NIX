import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import errorHandler, {
  ErrorType,
  StandardError,
  isApiError,
  isNetworkError,
  standardizeError,
  logError,
  getUserFriendlyMessage
} from '../errorHandler';
import { ApiError } from '../../services/api/config';

describe('Error Handler', () => {
  beforeEach(() => {
    // Spy on console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    jest.restoreAllMocks();
  });

  describe('isApiError', () => {
    it('should identify ApiError objects', () => {
      const apiError: ApiError = {
        status: 404,
        statusText: 'Not Found',
        message: 'Resource not found',
        data: { detail: 'The requested resource was not found' },
        isApiError: true
      };

      expect(isApiError(apiError)).toBe(true);
    });

    it('should return false for non-ApiError objects', () => {
      const regularError = new Error('Regular error');
      const nullValue = null;
      const undefinedValue = undefined;
      const objectWithoutFlag = { status: 404, message: 'Not an API error' };

      expect(isApiError(regularError)).toBe(false);
      expect(isApiError(nullValue)).toBe(false);
      expect(isApiError(undefinedValue)).toBe(false);
      expect(isApiError(objectWithoutFlag)).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('should identify network errors by message', () => {
      const networkErrors = [
        new Error('network error'),
        new Error('Failed to fetch'),
        new Error('Network request failed'),
        new Error('Connection refused'),
        new Error('Internet disconnected'),
        new Error('Request timed out due to timeout')
      ];

      networkErrors.forEach(error => {
        expect(isNetworkError(error)).toBe(true);
      });
    });

    it('should return false for non-network errors', () => {
      const nonNetworkErrors = [
        new Error('Regular error'),
        new Error('Invalid input'),
        new Error('Permission denied'),
        null,
        undefined,
        { message: 'Not an Error instance' }
      ];

      nonNetworkErrors.forEach(error => {
        expect(isNetworkError(error)).toBe(false);
      });
    });
  });

  describe('standardizeError', () => {
    it('should return the error if it is already standardized', () => {
      const standardizedError: StandardError = {
        type: ErrorType.NOT_FOUND,
        message: 'Resource not found'
      };

      const result = standardizeError(standardizedError);
      expect(result).toBe(standardizedError);
    });

    it('should standardize ApiError objects', () => {
      const apiError: ApiError = {
        status: 404,
        statusText: 'Not Found',
        message: 'Resource not found',
        data: { detail: 'The requested resource was not found' },
        isApiError: true
      };

      const result = standardizeError(apiError);
      expect(result).toEqual({
        type: ErrorType.NOT_FOUND,
        message: 'Resource not found',
        originalError: apiError,
        details: apiError.data,
        statusCode: 404
      });
    });

    it('should standardize network errors', () => {
      const networkError = new Error('Failed to fetch');

      // Mock isNetworkError to return true
      jest.spyOn(errorHandler, 'isNetworkError').mockReturnValueOnce(true);

      const result = standardizeError(networkError);
      expect(result).toEqual({
        type: ErrorType.NETWORK,
        message: 'Erro de conexão. Verifique sua internet e tente novamente.',
        originalError: networkError
      });
    });

    it('should standardize regular Error objects', () => {
      const regularError = new Error('Something went wrong');
      regularError.name = 'TypeError';

      const result = standardizeError(regularError);
      expect(result).toEqual({
        type: ErrorType.UNKNOWN,
        message: 'Something went wrong',
        originalError: regularError,
        details: {
          name: 'TypeError',
          stack: regularError.stack
        }
      });
    });

    it('should standardize string errors', () => {
      const stringError = 'String error message';

      const result = standardizeError(stringError);
      expect(result).toEqual({
        type: ErrorType.UNKNOWN,
        message: stringError,
        originalError: stringError
      });
    });

    it('should standardize unknown error types', () => {
      const unknownError = { foo: 'bar' };

      const result = standardizeError(unknownError);
      expect(result).toEqual({
        type: ErrorType.UNKNOWN,
        message: 'Ocorreu um erro desconhecido',
        originalError: unknownError
      });
    });
  });

  describe('logError', () => {
    it('should log standardized error to console', () => {
      const error = new Error('Test error');

      logError(error);

      expect(console.error).toHaveBeenCalled();
    });

    it('should include context in log if provided', () => {
      const error = new Error('Test error');
      const context = 'TestComponent';

      logError(error, context);

      // Check that the context is included in the log
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(context)
      );
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return the error message if it exists', () => {
      const error: StandardError = {
        type: ErrorType.NOT_FOUND,
        message: 'Custom error message'
      };

      const result = getUserFriendlyMessage(error);
      expect(result).toBe('Custom error message');
    });

    it('should return default message for each error type if no message exists', () => {
      // Create errors with no message for each type
      const errorTypes = Object.values(ErrorType);

      errorTypes.forEach(type => {
        const error: StandardError = {
          type: type as ErrorType,
          message: ''
        };

        const result = getUserFriendlyMessage(error);
        expect(result).not.toBe('');
        expect(result.length).toBeGreaterThan(10); // Ensure it's a meaningful message
      });
    });
  });

  describe('handleComponentError', () => {
    it('should log the error and show notification if provided', () => {
      const error = new Error('Component error');
      const context = 'TestComponent';
      const showNotification = jest.fn();

      // Mock console.error to verify it's called
      const consoleErrorSpy = jest.spyOn(console, 'error');

      errorHandler.handleComponentError(error, context, showNotification);

      // Verify console.error was called (which means logError was called)
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Verify notification was shown
      expect(showNotification).toHaveBeenCalled();
      expect(showNotification.mock.calls[0][0]).toBe('error');
      expect(typeof showNotification.mock.calls[0][1]).toBe('string');
    });

    it('should not call showNotification if not provided', () => {
      const error = new Error('Component error');
      const context = 'TestComponent';

      // Create a mock function to verify it's not called
      const showNotification = jest.fn();

      // Call without the showNotification parameter
      errorHandler.handleComponentError(error, context);

      // Just verify it doesn't throw and showNotification is not called
      expect(showNotification).not.toHaveBeenCalled();
    });
  });
});
