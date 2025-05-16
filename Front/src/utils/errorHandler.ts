/**
 * Utilitário para tratamento de erros
 * 
 * Este módulo fornece funções para lidar com erros de forma consistente em toda a aplicação.
 */

import { ApiError } from '../services/api/config';

/**
 * Tipos de erros
 */
export enum ErrorType {
  API = 'api',
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown'
}

/**
 * Interface para erros padronizados
 */
export interface StandardError {
  type: ErrorType;
  message: string;
  originalError?: unknown;
  details?: Record<string, unknown>;
  statusCode?: number;
}

/**
 * Verifica se um erro é uma instância de ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isApiError' in error &&
    (error as ApiError).isApiError === true
  );
}

/**
 * Verifica se um erro é um erro de rede
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    // Verificar mensagens comuns de erros de rede
    const networkErrorMessages = [
      'network error',
      'failed to fetch',
      'network request failed',
      'connection refused',
      'internet disconnected',
      'timeout'
    ];
    
    return networkErrorMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }
  
  return false;
}

/**
 * Converte um erro para um formato padronizado
 */
export function standardizeError(error: unknown): StandardError {
  // Se já for um erro padronizado, retorná-lo
  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    typeof (error as StandardError).type === 'string' &&
    typeof (error as StandardError).message === 'string'
  ) {
    return error as StandardError;
  }
  
  // Tratar erros da API
  if (isApiError(error)) {
    // Determinar o tipo de erro com base no status
    let type = ErrorType.API;
    
    if (error.status === 401) {
      type = ErrorType.AUTHENTICATION;
    } else if (error.status === 403) {
      type = ErrorType.PERMISSION;
    } else if (error.status === 404) {
      type = ErrorType.NOT_FOUND;
    } else if (error.status === 400 || error.status === 422) {
      type = ErrorType.VALIDATION;
    }
    
    return {
      type,
      message: error.message,
      originalError: error,
      details: error.data,
      statusCode: error.status
    };
  }
  
  // Tratar erros de rede
  if (isNetworkError(error)) {
    return {
      type: ErrorType.NETWORK,
      message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      originalError: error
    };
  }
  
  // Tratar erros padrão do JavaScript
  if (error instanceof Error) {
    return {
      type: ErrorType.UNKNOWN,
      message: error.message,
      originalError: error,
      details: {
        name: error.name,
        stack: error.stack
      }
    };
  }
  
  // Tratar outros tipos de erros
  return {
    type: ErrorType.UNKNOWN,
    message: typeof error === 'string' ? error : 'Ocorreu um erro desconhecido',
    originalError: error
  };
}

/**
 * Registra um erro no console com informações detalhadas
 */
export function logError(error: unknown, context?: string): void {
  const standardError = standardizeError(error);
  
  // Criar mensagem de log
  const logParts = [
    `[ERROR]${context ? ` [${context}]` : ''}`,
    `Type: ${standardError.type}`,
    `Message: ${standardError.message}`
  ];
  
  if (standardError.statusCode) {
    logParts.push(`Status: ${standardError.statusCode}`);
  }
  
  // Log principal
  console.error(logParts.join(' | '));
  
  // Log de detalhes
  if (standardError.details) {
    console.error('Error details:', standardError.details);
  }
  
  // Log do erro original
  if (standardError.originalError && standardError.originalError !== error) {
    console.error('Original error:', standardError.originalError);
  }
}

/**
 * Obtém uma mensagem amigável para o usuário com base no erro
 */
export function getUserFriendlyMessage(error: unknown): string {
  const standardError = standardizeError(error);
  
  // Mensagens padrão por tipo de erro
  const defaultMessages: Record<ErrorType, string> = {
    [ErrorType.API]: 'Ocorreu um erro ao comunicar com o servidor.',
    [ErrorType.NETWORK]: 'Erro de conexão. Verifique sua internet e tente novamente.',
    [ErrorType.VALIDATION]: 'Os dados fornecidos são inválidos. Verifique e tente novamente.',
    [ErrorType.AUTHENTICATION]: 'Você precisa estar autenticado para realizar esta ação.',
    [ErrorType.PERMISSION]: 'Você não tem permissão para realizar esta ação.',
    [ErrorType.NOT_FOUND]: 'O recurso solicitado não foi encontrado.',
    [ErrorType.UNKNOWN]: 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
  };
  
  // Usar a mensagem do erro se for amigável, ou a mensagem padrão
  return standardError.message || defaultMessages[standardError.type];
}

/**
 * Função para lidar com erros em componentes
 */
export function handleComponentError(
  error: unknown,
  context: string,
  showNotification?: (type: string, message: string) => void
): void {
  // Padronizar e registrar o erro
  const standardError = standardizeError(error);
  logError(standardError, context);
  
  // Mostrar notificação se a função estiver disponível
  if (showNotification) {
    const message = getUserFriendlyMessage(standardError);
    showNotification('error', message);
  }
}

/**
 * Exportar o utilitário completo
 */
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
