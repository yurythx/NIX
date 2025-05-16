/**
 * Serviço de comentários
 */
import { API_BASE_URL, API_ENDPOINTS, getDefaultHeaders, handleApiError } from './config';
import { getAccessToken } from './auth.service';

// Interfaces para os modelos de comentário
export interface Comment {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    username: string;
    avatar?: string;
  };
  parent?: number;
  replies?: Comment[];
}

export interface CommentCreateData {
  content: string;
  parent?: number;
}

/**
 * Obtém comentários para um livro específico
 */
export const getBookComments = async (bookSlug: string): Promise<Comment[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKS.BOOK_COMMENTS(bookSlug)}`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });

    await handleApiError(response);
    const data = await response.json();

    // Verificar se os dados retornados são um array
    if (Array.isArray(data)) {
      return data;
    }

    // Verificar se os dados retornados são uma resposta paginada
    if (data && typeof data === 'object' && 'results' in data) {
      return data.results;
    }

    console.error('API retornou um formato inválido para comentários:', data);
    return [];
  } catch (error) {
    console.error(`Erro ao buscar comentários para o livro ${bookSlug}:`, error);
    return [];
  }
};

/**
 * Cria um novo comentário para um livro
 */
export const createBookComment = async (bookSlug: string, data: CommentCreateData): Promise<Comment> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKS.BOOK_COMMENTS(bookSlug)}`, {
      method: 'POST',
      headers: getDefaultHeaders(token),
      body: JSON.stringify(data),
    });

    await handleApiError(response);
    return response.json();
  } catch (error) {
    console.error(`Erro ao criar comentário para o livro ${bookSlug}:`, error);
    throw error;
  }
};

/**
 * Atualiza um comentário existente
 */
export const updateComment = async (commentId: number, content: string): Promise<Comment> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COMMENTS.DETAIL(commentId)}`, {
      method: 'PATCH',
      headers: getDefaultHeaders(token),
      body: JSON.stringify({ content }),
    });

    await handleApiError(response);
    return response.json();
  } catch (error) {
    console.error(`Erro ao atualizar comentário ${commentId}:`, error);
    throw error;
  }
};

/**
 * Exclui um comentário
 */
export const deleteComment = async (commentId: number): Promise<void> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COMMENTS.DETAIL(commentId)}`, {
      method: 'DELETE',
      headers: getDefaultHeaders(token),
    });

    await handleApiError(response);
    return;
  } catch (error) {
    console.error(`Erro ao excluir comentário ${commentId}:`, error);
    throw error;
  }
};

// Exportar o serviço completo
const commentsService = {
  getBookComments,
  createBookComment,
  updateComment,
  deleteComment
};

export default commentsService;
