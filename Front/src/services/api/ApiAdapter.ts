/**
 * Adaptador para a API
 * Implementa o padrão de adaptador para encapsular a lógica de comunicação com a API
 */

import { API_BASE_URL, getDefaultHeaders, handleApiError } from './config';
import { getAccessToken } from './auth.service';

/**
 * Adaptador para a API
 */
export class ApiAdapter {
  /**
   * URL base da API
   */
  private baseUrl: string;

  /**
   * Construtor
   */
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Realiza uma requisição GET
   */
  async get<T>(endpoint: string, requiresAuth: boolean = false): Promise<T> {
    const token = requiresAuth ? getAccessToken() : undefined;
    
    if (requiresAuth && !token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: getDefaultHeaders(token)
    });

    await handleApiError(response);
    return await response.json();
  }

  /**
   * Realiza uma requisição POST
   */
  async post<T>(endpoint: string, data: any, requiresAuth: boolean = false): Promise<T> {
    const token = requiresAuth ? getAccessToken() : undefined;
    
    if (requiresAuth && !token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: getDefaultHeaders(token),
      body: JSON.stringify(data)
    });

    await handleApiError(response);
    return await response.json();
  }

  /**
   * Realiza uma requisição PUT
   */
  async put<T>(endpoint: string, data: any, requiresAuth: boolean = false): Promise<T> {
    const token = requiresAuth ? getAccessToken() : undefined;
    
    if (requiresAuth && !token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: getDefaultHeaders(token),
      body: JSON.stringify(data)
    });

    await handleApiError(response);
    return await response.json();
  }

  /**
   * Realiza uma requisição PATCH
   */
  async patch<T>(endpoint: string, data: any, requiresAuth: boolean = false): Promise<T> {
    const token = requiresAuth ? getAccessToken() : undefined;
    
    if (requiresAuth && !token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: getDefaultHeaders(token),
      body: JSON.stringify(data)
    });

    await handleApiError(response);
    return await response.json();
  }

  /**
   * Realiza uma requisição DELETE
   */
  async delete<T>(endpoint: string, requiresAuth: boolean = false): Promise<T> {
    const token = requiresAuth ? getAccessToken() : undefined;
    
    if (requiresAuth && !token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: getDefaultHeaders(token)
    });

    await handleApiError(response);
    return await response.json();
  }

  /**
   * Realiza upload de arquivo
   */
  async uploadFile<T>(endpoint: string, file: File, fieldName: string = 'file', requiresAuth: boolean = true): Promise<T> {
    const token = requiresAuth ? getAccessToken() : undefined;
    
    if (requiresAuth && !token) {
      throw new Error('Usuário não autenticado');
    }
    
    const formData = new FormData();
    formData.append(fieldName, file);
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: formData
    });

    await handleApiError(response);
    return await response.json();
  }
}

// Exportar uma instância única do adaptador (Singleton)
export const apiAdapter = new ApiAdapter();
