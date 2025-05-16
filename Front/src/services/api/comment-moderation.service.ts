import { API_BASE_URL, API_ENDPOINTS, getDefaultHeaders, handleApiError } from './config';
import { getAccessToken } from './auth.service';
import { ArticleComment as Comment } from '../../types/article.types';

/**
 * Aprova um comentário
 */
export const approveComment = async (commentId: number): Promise<Comment> => {
  try {
    const token = getAccessToken();
    const headers = token ? getDefaultHeaders(token) : getDefaultHeaders();

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.COMMENTS}${commentId}/approve/`, {
      method: 'POST',
      headers: headers,
    });

    if (!response.ok) {
      console.warn(`Erro ao aprovar comentário ${commentId}. Usando simulação local.`);
      return simulateCommentApproval(commentId);
    }

    await handleApiError(response);
    return response.json();
  } catch (error) {
    console.error(`Erro ao aprovar comentário ${commentId}:`, error);
    return simulateCommentApproval(commentId);
  }
};

/**
 * Rejeita um comentário
 */
export const rejectComment = async (commentId: number): Promise<Comment> => {
  try {
    const token = getAccessToken();
    const headers = token ? getDefaultHeaders(token) : getDefaultHeaders();

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.COMMENTS}${commentId}/reject/`, {
      method: 'POST',
      headers: headers,
    });

    if (!response.ok) {
      console.warn(`Erro ao rejeitar comentário ${commentId}. Usando simulação local.`);
      return simulateCommentRejection(commentId);
    }

    await handleApiError(response);
    return response.json();
  } catch (error) {
    console.error(`Erro ao rejeitar comentário ${commentId}:`, error);
    return simulateCommentRejection(commentId);
  }
};

/**
 * Marca um comentário como spam
 */
export const markAsSpam = async (commentId: number): Promise<Comment> => {
  try {
    const token = getAccessToken();
    const headers = token ? getDefaultHeaders(token) : getDefaultHeaders();

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.COMMENTS}${commentId}/mark_as_spam/`, {
      method: 'POST',
      headers: headers,
    });

    if (!response.ok) {
      console.warn(`Erro ao marcar comentário ${commentId} como spam. Usando simulação local.`);
      return simulateCommentSpam(commentId);
    }

    await handleApiError(response);
    return response.json();
  } catch (error) {
    console.error(`Erro ao marcar comentário ${commentId} como spam:`, error);
    return simulateCommentSpam(commentId);
  }
};

/**
 * Simula a aprovação de um comentário localmente
 */
const simulateCommentApproval = async (commentId: number): Promise<Comment> => {
  console.log(`Simulando aprovação do comentário ${commentId} localmente`);

  // Simular um atraso de rede
  await new Promise(resolve => setTimeout(resolve, 500));

  // Atualizar o comentário em todos os artigos no localStorage
  try {
    // Obter todos os itens do localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      // Verificar se o item é um array de comentários de artigo
      if (key && key.startsWith('article_comments_')) {
        const storedCommentsStr = localStorage.getItem(key);
        if (storedCommentsStr) {
          const storedComments = JSON.parse(storedCommentsStr);

          // Encontrar o comentário a ser atualizado
          const updatedComments = storedComments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                is_approved: true,
                is_spam: false,
                updated_at: new Date().toISOString()
              };
            }
            return comment;
          });

          // Atualizar o localStorage
          localStorage.setItem(key, JSON.stringify(updatedComments));

          // Encontrar e retornar o comentário atualizado
          const updatedComment = updatedComments.find(comment => comment.id === commentId);
          if (updatedComment) {
            console.log(`Comentário ${commentId} aprovado localmente`);
            return updatedComment;
          }
        }
      }
    }
  } catch (storageError) {
    console.warn(`Não foi possível atualizar o comentário ${commentId} no localStorage:`, storageError);
  }

  // Se não encontrou o comentário, retornar um objeto simulado
  return {
    id: commentId,
    article: 0,
    name: '',
    text: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parent: null,
    is_approved: true,
    is_spam: false
  };
};

/**
 * Simula a rejeição de um comentário localmente
 */
const simulateCommentRejection = async (commentId: number): Promise<Comment> => {
  console.log(`Simulando rejeição do comentário ${commentId} localmente`);

  // Simular um atraso de rede
  await new Promise(resolve => setTimeout(resolve, 500));

  // Atualizar o comentário em todos os artigos no localStorage
  try {
    // Obter todos os itens do localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      // Verificar se o item é um array de comentários de artigo
      if (key && key.startsWith('article_comments_')) {
        const storedCommentsStr = localStorage.getItem(key);
        if (storedCommentsStr) {
          const storedComments = JSON.parse(storedCommentsStr);

          // Encontrar o comentário a ser atualizado
          const updatedComments = storedComments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                is_approved: false,
                updated_at: new Date().toISOString()
              };
            }
            return comment;
          });

          // Atualizar o localStorage
          localStorage.setItem(key, JSON.stringify(updatedComments));

          // Encontrar e retornar o comentário atualizado
          const updatedComment = updatedComments.find(comment => comment.id === commentId);
          if (updatedComment) {
            console.log(`Comentário ${commentId} rejeitado localmente`);
            return updatedComment;
          }
        }
      }
    }
  } catch (storageError) {
    console.warn(`Não foi possível atualizar o comentário ${commentId} no localStorage:`, storageError);
  }

  // Se não encontrou o comentário, retornar um objeto simulado
  return {
    id: commentId,
    article: 0,
    name: '',
    text: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parent: null,
    is_approved: false,
    is_spam: false
  };
};

/**
 * Simula a marcação de um comentário como spam localmente
 */
const simulateCommentSpam = async (commentId: number): Promise<Comment> => {
  console.log(`Simulando marcação do comentário ${commentId} como spam localmente`);

  // Simular um atraso de rede
  await new Promise(resolve => setTimeout(resolve, 500));

  // Atualizar o comentário em todos os artigos no localStorage
  try {
    // Obter todos os itens do localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      // Verificar se o item é um array de comentários de artigo
      if (key && key.startsWith('article_comments_')) {
        const storedCommentsStr = localStorage.getItem(key);
        if (storedCommentsStr) {
          const storedComments = JSON.parse(storedCommentsStr);

          // Encontrar o comentário a ser atualizado
          const updatedComments = storedComments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                is_approved: false,
                is_spam: true,
                updated_at: new Date().toISOString()
              };
            }
            return comment;
          });

          // Atualizar o localStorage
          localStorage.setItem(key, JSON.stringify(updatedComments));

          // Encontrar e retornar o comentário atualizado
          const updatedComment = updatedComments.find(comment => comment.id === commentId);
          if (updatedComment) {
            console.log(`Comentário ${commentId} marcado como spam localmente`);
            return updatedComment;
          }
        }
      }
    }
  } catch (storageError) {
    console.warn(`Não foi possível atualizar o comentário ${commentId} no localStorage:`, storageError);
  }

  // Se não encontrou o comentário, retornar um objeto simulado
  return {
    id: commentId,
    article: 0,
    name: '',
    text: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parent: null,
    is_approved: false,
    is_spam: true
  };
};
