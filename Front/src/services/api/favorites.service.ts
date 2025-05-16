/**
 * Serviço de favoritos
 */
import { API_BASE_URL, API_ENDPOINTS, getDefaultHeaders, handleApiError } from './config';
import { getAccessToken } from './auth.service';

// Interfaces para os modelos de favorito
export interface Favorite {
  id: number;
  content_type: string;
  object_id: number;
  created_at: string;
}

/**
 * Obtém os favoritos do usuário
 * @param contentType Tipo de conteúdo ('articles', 'mangas', 'books')
 */
export const getUserFavorites = async (contentType: 'articles' | 'mangas' | 'books' = 'articles'): Promise<Favorite[]> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    let url = '';

    // Determinar a URL com base no tipo de conteúdo
    switch (contentType) {
      case 'articles':
        url = `${API_BASE_URL}${API_ENDPOINTS.ARTICLES.MY_FAVORITES}`;
        break;
      case 'mangas':
        url = `${API_BASE_URL}${API_ENDPOINTS.MANGAS.MY_FAVORITES}`;
        break;
      case 'books':
        // Se não houver endpoint específico para livros, use o de artigos como fallback
        url = `${API_BASE_URL}${API_ENDPOINTS.ARTICLES.MY_FAVORITES}`;
        console.warn('Endpoint específico para favoritos de livros não implementado. Usando fallback.');
        break;
      default:
        url = `${API_BASE_URL}${API_ENDPOINTS.ARTICLES.MY_FAVORITES}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: getDefaultHeaders(token),
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

    console.error('API retornou um formato inválido para favoritos:', data);
    return [];
  } catch (error) {
    console.error(`Erro ao buscar favoritos de ${contentType}:`, error);
    return [];
  }
};

/**
 * Verifica se um item é favorito
 * @param contentType Tipo de conteúdo ('articles.article', 'mangas.manga', 'books.book')
 * @param objectId ID do objeto
 * @param contentCategory Categoria do conteúdo para buscar os favoritos ('articles', 'mangas', 'books')
 */
export const isFavorite = async (
  contentType: string,
  objectId: number,
  contentCategory: 'articles' | 'mangas' | 'books' = 'articles'
): Promise<boolean> => {
  try {
    // Para artigos e mangás, podemos usar endpoints específicos
    if (contentType === 'articles.article' || contentType === 'mangas.manga') {
      // Obter o slug do objeto
      // Implementação futura: buscar o slug do objeto pelo ID

      // Por enquanto, usamos a abordagem genérica
      const favorites = await getUserFavorites(contentCategory);
      return favorites.some(
        favorite => favorite.content_type === contentType && favorite.object_id === objectId
      );
    }

    // Abordagem genérica para outros tipos de conteúdo
    const favorites = await getUserFavorites(contentCategory);
    return favorites.some(
      favorite => favorite.content_type === contentType && favorite.object_id === objectId
    );
  } catch (error) {
    console.error(`Erro ao verificar favorito (${contentType}, ${objectId}):`, error);
    return false;
  }
};

/**
 * Adiciona um item aos favoritos
 * @param contentType Tipo de conteúdo ('articles.article', 'mangas.manga', 'books.book')
 * @param objectId ID do objeto
 * @param slug Slug do objeto (necessário para alguns tipos de conteúdo)
 */
export const addFavorite = async (
  contentType: string,
  objectId: number,
  slug?: string
): Promise<Favorite> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    let url = '';
    let method = 'POST';
    let body = {};

    // Determinar a URL e o corpo da requisição com base no tipo de conteúdo
    if (contentType === 'articles.article' && slug) {
      url = `${API_BASE_URL}${API_ENDPOINTS.ARTICLES.FAVORITE(slug)}`;
      method = 'POST';
      // Não precisa de corpo para este endpoint
    } else if (contentType === 'mangas.manga' && slug) {
      url = `${API_BASE_URL}${API_ENDPOINTS.MANGAS.FAVORITE(slug)}`;
      method = 'POST';
      // Não precisa de corpo para este endpoint
    } else {
      // Fallback para um endpoint genérico (se existir)
      console.warn('Usando fallback para adicionar favorito. Isso pode não funcionar.');
      url = `${API_BASE_URL}/api/v1/favorites/`;
      body = {
        content_type: contentType,
        object_id: objectId
      };
    }

    const response = await fetch(url, {
      method,
      headers: getDefaultHeaders(token),
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });

    await handleApiError(response);
    return response.json();
  } catch (error) {
    console.error(`Erro ao adicionar favorito (${contentType}, ${objectId}):`, error);
    throw error;
  }
};

/**
 * Remove um item dos favoritos
 * @param contentType Tipo de conteúdo ('articles.article', 'mangas.manga', 'books.book')
 * @param objectId ID do objeto
 * @param slug Slug do objeto (necessário para alguns tipos de conteúdo)
 * @param contentCategory Categoria do conteúdo para buscar os favoritos ('articles', 'mangas', 'books')
 */
export const removeFavorite = async (
  contentType: string,
  objectId: number,
  slug?: string,
  contentCategory: 'articles' | 'mangas' | 'books' = 'articles'
): Promise<void> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    let url = '';
    let method = 'DELETE';

    // Determinar a URL com base no tipo de conteúdo
    if (contentType === 'articles.article' && slug) {
      url = `${API_BASE_URL}${API_ENDPOINTS.ARTICLES.FAVORITE(slug)}`;
      method = 'POST'; // Alguns endpoints usam POST com um parâmetro para remover
    } else if (contentType === 'mangas.manga' && slug) {
      url = `${API_BASE_URL}${API_ENDPOINTS.MANGAS.FAVORITE(slug)}`;
      method = 'POST'; // Alguns endpoints usam POST com um parâmetro para remover
    } else {
      // Fallback: tentar encontrar o ID do favorito e usar um endpoint genérico
      console.warn('Usando fallback para remover favorito. Isso pode não funcionar.');

      // Primeiro, encontrar o ID do favorito
      const favorites = await getUserFavorites(contentCategory);
      const favorite = favorites.find(
        fav => fav.content_type === contentType && fav.object_id === objectId
      );

      if (!favorite) {
        throw new Error('Favorito não encontrado');
      }

      // Usar um endpoint genérico (se existir)
      url = `${API_BASE_URL}/api/v1/favorites/${favorite.id}/`;
      method = 'DELETE';
    }

    const response = await fetch(url, {
      method,
      headers: getDefaultHeaders(token),
    });

    await handleApiError(response);
    return;
  } catch (error) {
    console.error(`Erro ao remover favorito (${contentType}, ${objectId}):`, error);
    throw error;
  }
};

/**
 * Alterna o estado de favorito de um item
 * @param contentType Tipo de conteúdo ('articles.article', 'mangas.manga', 'books.book')
 * @param objectId ID do objeto
 * @param slug Slug do objeto (necessário para alguns tipos de conteúdo)
 * @param contentCategory Categoria do conteúdo para buscar os favoritos ('articles', 'mangas', 'books')
 */
export const toggleFavorite = async (
  contentType: string,
  objectId: number,
  slug?: string,
  contentCategory: 'articles' | 'mangas' | 'books' = 'articles'
): Promise<boolean> => {
  try {
    // Para artigos e mangás com slug, podemos usar o endpoint direto
    if ((contentType === 'articles.article' || contentType === 'mangas.manga') && slug) {
      let url = '';

      if (contentType === 'articles.article') {
        url = `${API_BASE_URL}${API_ENDPOINTS.ARTICLES.FAVORITE(slug)}`;
      } else if (contentType === 'mangas.manga') {
        url = `${API_BASE_URL}${API_ENDPOINTS.MANGAS.FAVORITE(slug)}`;
      }

      const token = getAccessToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: getDefaultHeaders(token),
      });

      await handleApiError(response);
      const data = await response.json();

      // A resposta geralmente inclui o novo estado (is_favorite: true/false)
      return data.is_favorite === true;
    }

    // Para outros tipos de conteúdo, usamos a abordagem genérica
    const isFav = await isFavorite(contentType, objectId, contentCategory);

    if (isFav) {
      await removeFavorite(contentType, objectId, slug, contentCategory);
      return false;
    } else {
      await addFavorite(contentType, objectId, slug);
      return true;
    }
  } catch (error) {
    console.error(`Erro ao alternar favorito (${contentType}, ${objectId}):`, error);
    throw error;
  }
};

// Exportar o serviço completo
const favoritesService = {
  getUserFavorites,
  isFavorite,
  addFavorite,
  removeFavorite,
  toggleFavorite
};

export default favoritesService;
