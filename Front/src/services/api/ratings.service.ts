/**
 * Serviço de avaliações
 */
import { API_BASE_URL, API_ENDPOINTS, getDefaultHeaders, handleApiError } from './config';
import { getAccessToken } from './auth.service';

// Interfaces para os modelos de avaliação
export interface Rating {
  id: number;
  value: number;
  content_type: string;
  object_id: number;
  created_at: string;
  updated_at: string;
}

export interface RatingSummary {
  average: number;
  count: number;
  distribution: {
    [key: number]: number;
  };
}

/**
 * Obtém a avaliação do usuário para um item
 */
export const getUserRating = async (contentType: string, objectId: number): Promise<Rating | null> => {
  const token = getAccessToken();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.RATINGS.BASE}?content_type=${contentType}&object_id=${objectId}`,
      {
        method: 'GET',
        headers: getDefaultHeaders(token),
      }
    );

    await handleApiError(response);
    const data = await response.json();

    // Verificar se os dados retornados são um array
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }

    // Verificar se os dados retornados são uma resposta paginada
    if (data && typeof data === 'object' && 'results' in data && data.results.length > 0) {
      return data.results[0];
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar avaliação do usuário:', error);
    return null;
  }
};

/**
 * Obtém o resumo de avaliações para um item
 */
export const getRatingSummary = async (contentType: string, objectId: number): Promise<RatingSummary> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.RATINGS.SUMMARY}?content_type=${contentType}&object_id=${objectId}`,
      {
        method: 'GET',
        headers: getDefaultHeaders(),
      }
    );

    await handleApiError(response);
    return response.json();
  } catch (error) {
    console.error('Erro ao buscar resumo de avaliações:', error);
    return {
      average: 0,
      count: 0,
      distribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    };
  }
};

/**
 * Cria ou atualiza uma avaliação
 */
export const rateItem = async (contentType: string, objectId: number, value: number): Promise<Rating> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    // Verificar se o usuário já avaliou este item
    const existingRating = await getUserRating(contentType, objectId);

    if (existingRating) {
      // Atualizar avaliação existente
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RATINGS.BASE}${existingRating.id}/`, {
        method: 'PATCH',
        headers: getDefaultHeaders(token),
        body: JSON.stringify({ value }),
      });

      await handleApiError(response);
      return response.json();
    } else {
      // Criar nova avaliação
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RATINGS.BASE}`, {
        method: 'POST',
        headers: getDefaultHeaders(token),
        body: JSON.stringify({
          content_type: contentType,
          object_id: objectId,
          value,
        }),
      });

      await handleApiError(response);
      return response.json();
    }
  } catch (error) {
    console.error('Erro ao avaliar item:', error);
    throw error;
  }
};

/**
 * Remove uma avaliação
 */
export const removeRating = async (contentType: string, objectId: number): Promise<void> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    // Verificar se o usuário já avaliou este item
    const existingRating = await getUserRating(contentType, objectId);

    if (!existingRating) {
      throw new Error('Avaliação não encontrada');
    }

    // Excluir avaliação
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RATINGS.BASE}${existingRating.id}/`, {
      method: 'DELETE',
      headers: getDefaultHeaders(token),
    });

    await handleApiError(response);
    return;
  } catch (error) {
    console.error('Erro ao remover avaliação:', error);
    throw error;
  }
};

// Exportar o serviço completo
const ratingsService = {
  getUserRating,
  getRatingSummary,
  rateItem,
  removeRating,
};

export default ratingsService;
