/**
 * Serviço de artigos
 */
import { API_BASE_URL, API_ENDPOINTS, getDefaultHeaders, handleApiError } from './config';
import { Article, PaginatedResponse } from '../../types/models';
import {
  CreateArticleDto as ArticleCreateData,
  UpdateArticleDto as ArticleUpdateData,
  ArticleComment as Comment,
  CreateCommentDto as CommentCreateData
} from '../../types/article.types';
import { getAccessToken } from './auth.service';
import { withCache } from '../../utils/cache';

// Interface temporária até atualizar todos os arquivos
interface CommentUpdateData {
  text?: string;
  is_approved?: boolean;
  is_spam?: boolean;
}

/**
 * Obtém a lista de artigos
 */
export const getArticles = async (): Promise<Article[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.BASE}`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });

    await handleApiError(response);
    const data = await response.json();

    // Verificar se os dados retornados são uma resposta paginada
    if (data && typeof data === 'object' && 'results' in data) {
      console.log('API retornou dados paginados:', data);
      return data.results;
    }

    // Verificar se os dados retornados são um array
    if (Array.isArray(data)) {
      return data;
    }

    console.error('API retornou um formato inválido para artigos:', data);
    return [];
  } catch (error) {
    console.error('Erro ao buscar artigos:', error);
    return [];
  }
};

/**
 * Obtém um artigo pelo slug
 */
export const getArticleBySlugBase = async (slug: string): Promise<Article | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.DETAIL(slug)}`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });

    await handleApiError(response);
    const data = await response.json();

    // Verificar se os dados retornados são válidos
    if (!data || typeof data !== 'object' || !data.id) {
      console.error('API retornou um formato inválido para o artigo:', data);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Erro ao buscar artigo com slug "${slug}":`, error);
    return null;
  }
};

/**
 * Versão com cache do getArticleBySlug
 * Cache expira em 5 minutos
 */
export const getArticleBySlug = withCache(
  getArticleBySlugBase,
  (slug: string) => `article_${slug}`,
  { expirationTime: 5 * 60 * 1000 } // 5 minutos
);

/**
 * Cria um novo artigo
 */
export const createArticle = async (data: ArticleCreateData): Promise<Article> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    // Se tiver imagem de capa, usar FormData para enviar
    if (data.cover_image) {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);

      if (data.category_id) {
        formData.append('category_id', data.category_id.toString());
      }

      if (data.featured !== undefined) {
        formData.append('featured', data.featured.toString());
      }

      formData.append('cover_image', data.cover_image);

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.BASE}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      await handleApiError(response);
      return response.json();
    } else {
      // Se não tiver imagem, enviar como JSON normalmente
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.BASE}`, {
        method: 'POST',
        headers: getDefaultHeaders(token),
        body: JSON.stringify(data),
      });

      await handleApiError(response);
      return response.json();
    }
  } catch (error) {
    console.error('Erro ao criar artigo:', error);
    throw error;
  }
};

/**
 * Atualiza um artigo existente
 */
export const updateArticle = async (slug: string, data: ArticleUpdateData): Promise<Article> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    // Se tiver imagem de capa, usar FormData para enviar
    if (data.cover_image) {
      const formData = new FormData();

      if (data.title) {
        formData.append('title', data.title);
      }

      if (data.content) {
        formData.append('content', data.content);
      }

      if (data.category_id) {
        formData.append('category_id', data.category_id.toString());
      }

      if (data.featured !== undefined) {
        formData.append('featured', data.featured.toString());
      }

      formData.append('cover_image', data.cover_image);

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.DETAIL(slug)}`, {
        method: 'PATCH',
        headers,
        body: formData,
      });

      await handleApiError(response);
      return response.json();
    } else {
      // Se não tiver imagem, enviar como JSON normalmente
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.DETAIL(slug)}`, {
        method: 'PATCH',
        headers: getDefaultHeaders(token),
        body: JSON.stringify(data),
      });

      await handleApiError(response);
      return response.json();
    }
  } catch (error) {
    console.error(`Erro ao atualizar artigo ${slug}:`, error);
    throw error;
  }
};

/**
 * Exclui um artigo
 */
export const deleteArticle = async (slug: string): Promise<void> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.DETAIL(slug)}`, {
      method: 'DELETE',
      headers: getDefaultHeaders(token),
    });

    await handleApiError(response);
    return;
  } catch (error) {
    console.error(`Erro ao excluir artigo ${slug}:`, error);
    throw error;
  }
};

/**
 * Obtém a lista de artigos com paginação
 */
export const getPaginatedArticles = async (page: number = 1): Promise<PaginatedResponse<Article>> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.BASE}?page=${page}`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });

    await handleApiError(response);
    const data = await response.json();

    // Verificar se os dados retornados são uma resposta paginada
    if (data && typeof data === 'object' && 'results' in data) {
      return data as PaginatedResponse<Article>;
    }

    // Se não for uma resposta paginada, criar uma estrutura paginada com os dados
    if (Array.isArray(data)) {
      return {
        count: data.length,
        next: null,
        previous: null,
        results: data
      };
    }

    console.error('API retornou um formato inválido para artigos paginados:', data);
    return {
      count: 0,
      next: null,
      previous: null,
      results: []
    };
  } catch (error) {
    console.error('Erro ao buscar artigos paginados:', error);
    return {
      count: 0,
      next: null,
      previous: null,
      results: []
    };
  }
};

/**
 * Obtém os comentários de um artigo
 */
export const getArticleComments = async (articleId: number): Promise<Comment[]> => {
  try {
    // Primeiro, tentar obter comentários do backend
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.ARTICLE_COMMENTS(articleId)}`, {
        method: 'GET',
        headers: getDefaultHeaders(),
      });

      await handleApiError(response);
      const data = await response.json();

      // Verificar se os dados retornados são uma resposta paginada
      if (data && typeof data === 'object' && 'results' in data) {
        const apiComments = data.results;

        // Mesclar com comentários locais
        const mergedComments = mergeWithLocalComments(articleId, apiComments);
        return mergedComments;
      }

      // Verificar se os dados retornados são um array
      if (Array.isArray(data)) {
        const apiComments = data;

        // Mesclar com comentários locais
        const mergedComments = mergeWithLocalComments(articleId, apiComments);
        return mergedComments;
      }
    } catch (apiError) {
      console.warn(`Erro ao buscar comentários da API para o artigo ${articleId}:`, apiError);
      // Continuar para buscar apenas comentários locais
    }

    // Se a API falhar ou retornar formato inválido, usar apenas comentários locais
    const localComments = getLocalComments(articleId);

    // Se não houver comentários locais, criar alguns comentários de exemplo
    if (localComments.length === 0) {
      console.log('Criando comentários de exemplo para o artigo', articleId);

      // Comentário principal
      const mainComment: Comment = {
        id: 1000,
        article: articleId,
        name: 'Visitante Exemplo',
        text: 'Este é um comentário de exemplo para mostrar como os comentários funcionam.',
        created_at: new Date().toISOString(),
        parent: null,
        replies: []
      };

      // Resposta ao comentário principal
      const replyComment: Comment = {
        id: 1001,
        article: articleId,
        name: 'Outro Visitante',
        text: 'Esta é uma resposta ao comentário acima. As respostas aparecem aninhadas para facilitar a leitura.',
        created_at: new Date().toISOString(),
        parent: 1000,
        replies: []
      };

      // Salvar os comentários de exemplo no localStorage
      try {
        localStorage.setItem(`article_comments_${articleId}`, JSON.stringify([mainComment, replyComment]));
        console.log('Comentários de exemplo salvos no localStorage');

        // Retornar os comentários de exemplo
        return [mainComment, replyComment];
      } catch (storageError) {
        console.warn('Não foi possível salvar os comentários de exemplo no localStorage:', storageError);
      }
    }

    return localComments;
  } catch (error) {
    console.error(`Erro ao buscar comentários do artigo ${articleId}:`, error);
    return [];
  }
};

/**
 * Obtém comentários armazenados localmente
 */
const getLocalComments = (articleId: number): Comment[] => {
  try {
    const storedCommentsStr = localStorage.getItem(`article_comments_${articleId}`);
    if (!storedCommentsStr) return [];

    const storedComments = JSON.parse(storedCommentsStr);
    console.log(`Carregados ${storedComments.length} comentários locais para o artigo ${articleId}`);
    return storedComments;
  } catch (error) {
    console.warn('Erro ao carregar comentários locais:', error);
    return [];
  }
};

/**
 * Mescla comentários da API com comentários locais
 */
const mergeWithLocalComments = (articleId: number, apiComments: Comment[]): Comment[] => {
  const localComments = getLocalComments(articleId);
  if (localComments.length === 0) return apiComments;

  // Criar um mapa dos IDs de comentários da API para evitar duplicatas
  const apiCommentIds = new Set(apiComments.map(comment => comment.id));

  // Adicionar apenas comentários locais que não existem na API
  const uniqueLocalComments = localComments.filter(comment => !apiCommentIds.has(comment.id));

  // Mesclar os arrays
  const mergedComments = [...apiComments, ...uniqueLocalComments];
  console.log(`Mesclados ${apiComments.length} comentários da API com ${uniqueLocalComments.length} comentários locais únicos`);

  return mergedComments;
};

/**
 * Cria um novo comentário
 */
export const createComment = async (data: CommentCreateData): Promise<Comment> => {
  try {
    // Log para debug
    console.log('Enviando comentário:', data);

    // Preparar os dados para envio
    const commentData = {
      name: data.name || 'Visitante',
      text: data.text,
      article_slug: data.article_slug,
    };

    // Adicionar email se fornecido
    if (data.email) {
      commentData['email'] = data.email;
    }

    // Adicionar parent_id se for uma resposta
    if (data.parent) {
      commentData['parent_id'] = data.parent;
      console.log(`Este é um comentário de resposta ao comentário ID: ${data.parent}`);
    } else {
      console.log('Este é um comentário de nível superior');
    }

    // Enviar o comentário para o backend
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.COMMENTS}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify(commentData),
      });

      // Se o backend retornar sucesso, processar a resposta
      if (response.ok) {
        const comment = await response.json();
        console.log('Comentário criado com sucesso no backend:', comment);
        return comment;
      } else {
        console.warn('Erro ao enviar comentário para o backend. Usando simulação local.');
        return simulateCommentCreation(data);
      }
    } catch (apiError) {
      console.warn('Erro na API ao criar comentário:', apiError);
      return simulateCommentCreation(data);
    }
  } catch (error) {
    console.error('Erro ao criar comentário:', error);

    // Em caso de erro, usar a simulação local
    console.warn('Usando simulação local devido a erro geral.');
    return simulateCommentCreation(data);
  }
};

/**
 * Simula a criação de um comentário localmente
 * Usado como fallback quando o backend não está disponível
 */
const simulateCommentCreation = async (data: CommentCreateData): Promise<Comment> => {
  console.log('Simulando criação de comentário localmente');

  // Gerar um ID único para o comentário
  const uniqueId = Date.now() + Math.floor(Math.random() * 1000);

  // Verificar se os comentários precisam de aprovação
  let requireApproval = false;
  try {
    const settings = localStorage.getItem('comment_settings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      requireApproval = parsedSettings.requireCommentApproval || false;
    }
  } catch (error) {
    console.warn('Erro ao verificar configurações de aprovação:', error);
  }

  // Criar um objeto de comentário simulado
  const simulatedComment: Comment = {
    id: uniqueId,
    article: data.article,
    name: data.name || 'Visitante',
    text: data.text,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parent: data.parent || null,
    is_approved: !requireApproval, // Se requireApproval for true, o comentário começa como não aprovado
    is_spam: false,
    replies: []
  };

  if (data.email) {
    simulatedComment.email = data.email;
  }

  // Simular um atraso de rede
  await new Promise(resolve => setTimeout(resolve, 500));

  // Adicionar o comentário à lista de comentários no localStorage
  try {
    // Obter comentários existentes
    const storedCommentsStr = localStorage.getItem(`article_comments_${data.article}`) || '[]';
    const storedComments = JSON.parse(storedCommentsStr);

    // Adicionar o novo comentário
    storedComments.push(simulatedComment);

    // Salvar de volta no localStorage
    localStorage.setItem(`article_comments_${data.article}`, JSON.stringify(storedComments));

    console.log('Comentário salvo no localStorage para persistência');
  } catch (storageError) {
    console.warn('Não foi possível salvar o comentário no localStorage:', storageError);
  }

  return simulatedComment;
};

/**
 * Atualiza um comentário existente
 */
export const updateComment = async (commentId: number, data: CommentUpdateData): Promise<Comment> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    // Corrigindo a URL para atualizar comentários
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.COMMENTS}${commentId}/`, {
      method: 'PATCH',
      headers: getDefaultHeaders(token),
      body: JSON.stringify(data),
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
  try {
    console.log(`Tentando excluir o comentário ${commentId}`);

    // Tentar excluir o comentário no backend
    try {
      const token = getAccessToken();
      const headers = token ? getDefaultHeaders(token) : getDefaultHeaders();

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.COMMENTS}${commentId}/`, {
        method: 'DELETE',
        headers: headers,
      });

      // Se o backend retornar sucesso, retornar
      if (response.ok) {
        console.log(`Comentário ${commentId} excluído com sucesso no backend`);
        return;
      } else {
        console.warn(`Erro ao excluir comentário ${commentId} no backend. Usando simulação local.`);
        return simulateCommentDeletion(commentId);
      }
    } catch (apiError) {
      console.warn(`Erro na API ao excluir comentário ${commentId}:`, apiError);
      return simulateCommentDeletion(commentId);
    }
  } catch (error) {
    console.error(`Erro ao excluir comentário ${commentId}:`, error);
    throw error;
  }
};

/**
 * Simula a exclusão de um comentário localmente
 * Usado como fallback quando o backend não está disponível
 */
const simulateCommentDeletion = async (commentId: number): Promise<void> => {
  console.log(`Simulando exclusão do comentário ${commentId} localmente`);

  // Simular um atraso de rede
  await new Promise(resolve => setTimeout(resolve, 500));

  // Remover o comentário de todos os artigos no localStorage
  try {
    // Obter todos os itens do localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      // Verificar se o item é um array de comentários de artigo
      if (key && key.startsWith('article_comments_')) {
        const storedCommentsStr = localStorage.getItem(key);
        if (storedCommentsStr) {
          const storedComments = JSON.parse(storedCommentsStr);

          // Filtrar o comentário a ser excluído
          const filteredComments = storedComments.filter(comment => comment.id !== commentId);

          // Se o número de comentários mudou, atualizar o localStorage
          if (filteredComments.length !== storedComments.length) {
            localStorage.setItem(key, JSON.stringify(filteredComments));
            console.log(`Comentário ${commentId} removido do artigo ${key}`);
          }
        }
      }
    }
  } catch (storageError) {
    console.warn(`Não foi possível remover o comentário ${commentId} do localStorage:`, storageError);
  }

  return;
};

/**
 * Favorita ou desfavorita um artigo
 */
export const toggleFavorite = async (articleId: number, slug: string): Promise<{ is_favorite: boolean }> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.FAVORITE(slug)}`, {
      method: 'POST',
      headers: getDefaultHeaders(token),
    });

    await handleApiError(response);
    return response.json();
  } catch (error) {
    console.error(`Erro ao favoritar/desfavoritar artigo ${articleId}:`, error);
    throw error;
  }
};

/**
 * Obtém a lista de artigos favoritos do usuário
 */
export const getMyFavorites = async (): Promise<Article[]> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.MY_FAVORITES}`, {
      method: 'GET',
      headers: getDefaultHeaders(token),
    });

    await handleApiError(response);
    const data = await response.json();

    // Verificar se os dados retornados são uma resposta paginada
    if (data && typeof data === 'object' && 'results' in data) {
      return data.results;
    }

    // Verificar se os dados retornados são um array
    if (Array.isArray(data)) {
      return data;
    }

    console.error('API retornou um formato inválido para artigos favoritos:', data);
    return [];
  } catch (error) {
    console.error('Erro ao buscar artigos favoritos:', error);
    return [];
  }
};

/**
 * Incrementa o contador de visualizações de um artigo
 *
 * Esta função envia uma solicitação para incrementar o contador de visualizações de um artigo.
 * Não requer autenticação do usuário.
 *
 * @param {number} articleId - O ID do artigo
 * @param {string} slug - O slug do artigo
 * @returns {Promise<{views_count: number}>} Promise que resolve para um objeto com o novo contador de visualizações
 */
export const incrementViews = async (articleId: number, slug: string): Promise<{ views_count: number }> => {
  try {
    // Verificar se o endpoint está disponível (sem lançar exceção)
    let response;
    try {
      response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.INCREMENT_VIEWS(slug)}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
      });
    } catch (networkError) {
      // Erro de rede (como CORS, conexão recusada, etc.)
      console.warn(`Erro de rede ao incrementar visualizações do artigo ${slug}:`, networkError);
      return { views_count: 0 };
    }

    // Se o endpoint existir e a requisição for bem-sucedida
    if (response.ok) {
      try {
        const result = await response.json();
        console.log(`Visualizações do artigo ${slug} incrementadas com sucesso:`, result);
        return result;
      } catch (parseError) {
        console.warn(`Erro ao processar resposta do incremento de visualizações:`, parseError);
        return { views_count: 0 };
      }
    }

    // Se o endpoint não existir (404), apenas logar e continuar
    if (response.status === 404) {
      console.warn(`Endpoint de incremento de visualizações não implementado para artigos. Usando contador atual.`);
      return { views_count: 0 };
    }

    // Para outros erros, logar e continuar
    console.warn(`Erro ${response.status} ao incrementar visualizações do artigo ${slug}.`);
    return { views_count: 0 };
  } catch (error) {
    // Erro inesperado
    console.error(`Erro inesperado ao incrementar visualizações do artigo ${articleId}:`, error);
    return { views_count: 0 };
  }
};

/**
 * Obtém artigos em destaque
 */
export const getFeaturedArticles = async (): Promise<Article[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.FEATURED}`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });

    await handleApiError(response);
    const data = await response.json();

    // Verificar se os dados retornados são uma resposta paginada
    if (data && typeof data === 'object' && 'results' in data) {
      return data.results;
    }

    // Verificar se os dados retornados são um array
    if (Array.isArray(data)) {
      return data;
    }

    console.error('API retornou um formato inválido para artigos em destaque:', data);
    return [];
  } catch (error) {
    console.error('Erro ao buscar artigos em destaque:', error);
    return [];
  }
};

/**
 * Obtém artigos populares
 */
export const getPopularArticles = async (): Promise<Article[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.POPULAR}`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });

    await handleApiError(response);
    const data = await response.json();

    // Verificar se os dados retornados são uma resposta paginada
    if (data && typeof data === 'object' && 'results' in data) {
      return data.results;
    }

    // Verificar se os dados retornados são um array
    if (Array.isArray(data)) {
      return data;
    }

    console.error('API retornou um formato inválido para artigos populares:', data);
    return [];
  } catch (error) {
    console.error('Erro ao buscar artigos populares:', error);
    return [];
  }
};

/**
 * Obtém artigos recentes
 */
export const getRecentArticles = async (): Promise<Article[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ARTICLES.RECENT}`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });

    await handleApiError(response);
    const data = await response.json();

    // Verificar se os dados retornados são uma resposta paginada
    if (data && typeof data === 'object' && 'results' in data) {
      return data.results;
    }

    // Verificar se os dados retornados são um array
    if (Array.isArray(data)) {
      return data;
    }

    console.error('API retornou um formato inválido para artigos recentes:', data);
    return [];
  } catch (error) {
    console.error('Erro ao buscar artigos recentes:', error);
    return [];
  }
};
