/**
 * Serviço para testar a conexão com o backend
 */

import { API_BASE_URL, getDefaultHeaders, handleApiError } from './config';

/**
 * Interface para a resposta do endpoint de health check
 */
export interface TestResponse {
  status: string;
  timestamp: string;
  components?: {
    database?: {
      status: string;
      type: string;
    };
    api?: {
      status: string;
    };
  };
}

/**
 * Testa a conexão com o backend usando o endpoint de health check
 *
 * @returns {Promise<TestResponse>} Promise que resolve para a resposta do endpoint de health check
 */
export const testBackendConnection = async (): Promise<TestResponse> => {
  try {
    // Usar o endpoint de health check
    const response = await fetch(`${API_BASE_URL}/api/v1/health/`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });

    await handleApiError(response);
    const data = await response.json();

    console.log('Teste de conexão com o backend bem-sucedido:', data);
    return data as TestResponse;
  } catch (error) {
    console.error('Erro ao testar conexão com o backend:', error);
    throw error;
  }
};

/**
 * Verifica se o backend está disponível
 *
 * @returns {Promise<boolean>} Promise que resolve para true se o backend estiver disponível, false caso contrário
 */
export const isBackendAvailable = async (): Promise<boolean> => {
  try {
    const response = await testBackendConnection();
    // Verificar se o status é 'healthy' ou 'Online'
    return response.status === 'healthy' || response.status === 'Online';
  } catch (error) {
    console.warn('Backend não está disponível:', error);
    return false;
  }
};
