/**
 * Serviço para testar a conexão com o backend
 */

import { API_BASE_URL, API_ENDPOINTS, getDefaultHeaders, handleApiError } from './config';

/**
 * Interface para a resposta do endpoint de teste
 */
export interface TestResponse {
  status: string;
  message: string;
  timestamp: string;
}

/**
 * Testa a conexão com o backend
 *
 * @returns {Promise<TestResponse>} Promise que resolve para a resposta do endpoint de teste
 */
export const testBackendConnection = async (): Promise<TestResponse> => {
  try {
    // Tentar primeiro o endpoint de teste para mangás
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MANGAS.MANGAS_TEST}`, {
        method: 'GET',
        headers: getDefaultHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Teste de conexão com o endpoint de mangás bem-sucedido:', data);
        return data as TestResponse;
      }
    } catch (e) {
      console.warn('Erro ao testar conexão com o endpoint de mangás:', e);
    }

    // Tentar o endpoint de teste para livros
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKS.TEST}`, {
        method: 'GET',
        headers: getDefaultHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Teste de conexão com o endpoint de livros bem-sucedido:', data);
        return data as TestResponse;
      }
    } catch (e) {
      console.warn('Erro ao testar conexão com o endpoint de livros:', e);
    }

    // Se falhar, tentar o endpoint de teste geral
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MANGAS.TEST}`, {
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
    await testBackendConnection();
    return true;
  } catch (error) {
    console.warn('Backend não está disponível:', error);
    return false;
  }
};
