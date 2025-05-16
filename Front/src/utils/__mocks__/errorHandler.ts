/**
 * Mock do utilitário de tratamento de erros
 */

// Tipos de erros
export enum ErrorType {
  API = 'api',
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown'
}

// Interface para erros padronizados
export interface StandardError {
  type: ErrorType;
  message: string;
  originalError?: unknown;
  details?: Record<string, unknown>;
  statusCode?: number;
}

// Mock das funções
export const isApiError = jest.fn(() => false);
export const isNetworkError = jest.fn(() => false);
export const standardizeError = jest.fn((error: unknown): StandardError => {
  if (error instanceof Error) {
    return {
      type: ErrorType.UNKNOWN,
      message: error.message,
      originalError: error
    };
  }
  return {
    type: ErrorType.UNKNOWN,
    message: 'Erro desconhecido',
    originalError: error
  };
});
export const logError = jest.fn();
export const getUserFriendlyMessage = jest.fn(() => 'Ocorreu um erro');
export const handleComponentError = jest.fn();

// Exportar o utilitário completo
const errorHandler = {
  standardizeError,
  logError,
  getUserFriendlyMessage,
  handleComponentError,
  isApiError,
  isNetworkError,
  ErrorType
};

export default errorHandler;
