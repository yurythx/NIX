/**
 * Configuração da API
 */

// URL base da API
export let API_BASE_URL = 'http://localhost:8000';

// Caso esteja em ambiente de produção, usar a variável de ambiente
if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) {
  API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
}

// Endpoints da API
export const API_ENDPOINTS = {
  // Autenticação
  AUTH: {
    LOGIN: '/api/v1/auth/jwt/create/',
    REFRESH: '/api/v1/auth/jwt/refresh/',
    VERIFY: '/api/v1/auth/jwt/verify/',
    REGISTER: '/api/v1/auth/users/',
    CURRENT_USER: '/api/v1/auth/users/me/',
  },

  // Usuários
  USERS: {
    BASE: '/api/v1/accounts/users/',
    DETAIL: (slug: string) => `/api/v1/accounts/users/${slug}/`,
    PASSWORD_CHANGE: '/api/v1/accounts/users/change-password/',
    UPDATE_PROFILE: '/api/v1/accounts/users/update-profile/',
  },

  // Configurações
  SETTINGS: {
    BASE: '/api/v1/accounts/settings/',
    MY_SETTINGS: '/api/v1/accounts/settings/my_settings/',
  },

  // Artigos
  ARTICLES: {
    BASE: '/api/v1/articles/articles/',
    DETAIL: (slug: string) => `/api/v1/articles/articles/${slug}/`,
    COMMENTS: '/api/v1/articles/comments/',
    ARTICLE_COMMENTS: (articleId: number) => `/api/v1/articles/comments/?article=${articleId}`,
    // Endpoints do back-end
    INCREMENT_VIEWS: (slug: string) => `/api/v1/articles/articles/${slug}/increment_views/`,
    FEATURED: '/api/v1/articles/articles/?featured=true',
    POPULAR: '/api/v1/articles/articles/?ordering=-views_count',
    RECENT: '/api/v1/articles/articles/?ordering=-created_at',
    FAVORITE: (slug: string) => `/api/v1/articles/articles/${slug}/favorite/`,
    MY_FAVORITES: '/api/v1/articles/articles/favorites/',
  },

  // Livros
  BOOKS: {
    BASE: '/api/v1/books/books/',
    DETAIL: (slug: string) => `/api/v1/books/books/${slug}/`,
    FEATURED: '/api/v1/books/books/?featured=true',
    POPULAR: '/api/v1/books/books/?ordering=-views_count',
    RECENT: '/api/v1/books/books/?ordering=-created_at',
    CHUNKED_UPLOAD: '/api/v1/books/chunked-upload/',
    COMMENTS: '/api/v1/books/comments/',
    BOOK_COMMENTS: (bookSlug: string) => `/api/v1/books/comments/?book_slug=${bookSlug}`,
    INCREMENT_VIEWS: (slug: string) => `/api/v1/books/books/${slug}/increment_views/`,
    TEST: '/api/v1/books/test/',
  },

  // Comentários universais
  COMMENTS: {
    BASE: '/api/v1/comments/',
    DETAIL: (id: number) => `/api/v1/comments/${id}/`,
  },

  // Mangás
  MANGAS: {
    BASE: '/api/v1/mangas/mangas/',
    DETAIL: (slug: string) => `/api/v1/mangas/mangas/${slug}/`,
    CATEGORIES: '/api/v1/mangas/categories/',
    CHUNKED_UPLOAD: '/api/v1/mangas/chunked-upload/',
    FAVORITE: (slug: string) => `/api/v1/mangas/mangas/${slug}/favorite/`,
    MY_FAVORITES: '/api/v1/mangas/mangas/my_favorites/',
    UPDATE_PROGRESS: (slug: string) => `/api/v1/mangas/mangas/${slug}/update_progress/`,
    CHAPTER_COMMENT: (chapterId: number) => `/api/v1/mangas/chapters/${chapterId}/comment/`,
    CHAPTER_COMMENTS: (chapterId: number) => `/api/v1/mangas/chapters/${chapterId}/comments/`,
    HISTORY_RECORD: '/api/v1/mangas/history/record_view/',
    MY_HISTORY: '/api/v1/mangas/history/my_history/',
    INCREMENT_VIEWS: (slug: string) => `/api/v1/mangas/mangas/${slug}/increment_views/`,
    TEST: '/api/v1/mangas/test/',
    MANGAS_TEST: '/api/v1/mangas/mangas-test/',
  },

  // Categorias
  CATEGORIES: {
    BASE: '/api/v1/categories/',
    DETAIL: (slug: string) => `/api/v1/categories/${slug}/`,
  },

  // Ratings
  RATINGS: {
    BASE: '/api/v1/ratings/',
    SUMMARY: '/api/v1/ratings/summary/',
    CREATE: '/api/v1/ratings/rate/',
    MY_RATINGS: '/api/v1/ratings/my_ratings/'
  },

  // Favoritos (Nota: Não existe um endpoint genérico para favoritos)
  // Cada tipo de conteúdo tem seu próprio endpoint para favoritos
  // Use os endpoints específicos em cada serviço (ex: ARTICLES.FAVORITE, MANGAS.FAVORITE)
};

// Configuração de headers padrão
export const getDefaultHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Tipos de erro da API
export interface ApiError {
  status: number;
  statusText: string;
  message: string;
  data: Record<string, unknown>;
  isApiError: boolean;
}

// Função para obter mensagem de erro amigável com base no status HTTP
export const getErrorMessage = (status: number, data: Record<string, unknown>): string => {
  // Verificar se há uma mensagem de erro específica para autenticação
  if (status === 401) {
    if (data && typeof data.detail === 'string') {
      if (data.detail.includes('token_not_valid')) {
        return 'Sua sessão expirou. Por favor, faça login novamente.';
      }
      if (data.detail.includes('invalid_credentials')) {
        return 'Email ou senha incorretos. Por favor, tente novamente.';
      }
      return data.detail;
    }
    return 'Autenticação necessária. Faça login para continuar.';
  }

  // Verificar se há uma mensagem de erro específica para permissão
  if (status === 403) {
    if (data && typeof data.detail === 'string') {
      if (data.detail.includes('not_authenticated')) {
        return 'Você precisa estar autenticado para realizar esta ação.';
      }
      if (data.detail.includes('permission_denied')) {
        return 'Você não tem permissão para realizar esta ação.';
      }
      return data.detail;
    }
    return 'Você não tem permissão para realizar esta ação.';
  }

  switch (status) {
    case 400:
      // Tentar extrair mensagens de erro específicas dos campos
      if (data && typeof data === 'object') {
        // Verificar erros de validação de formulário
        const fieldErrors = Object.entries(data)
          .filter(([key, value]) => key !== 'detail' && Array.isArray(value))
          .map(([key, value]) => `${key}: ${(value as string[]).join(', ')}`)
          .join('; ');

        if (fieldErrors) {
          return `Dados inválidos: ${fieldErrors}`;
        }

        // Verificar erros de validação não-campo
        if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
          return (data.non_field_errors as string[]).join(', ');
        }

        // Verificar se há uma mensagem de erro geral
        if (typeof data.detail === 'string') {
          return data.detail;
        }
      }
      return 'Requisição inválida. Verifique os dados enviados.';

    case 404:
      if (data && typeof data.detail === 'string') {
        return data.detail;
      }
      return 'O recurso solicitado não foi encontrado.';

    case 409:
      if (data && typeof data.detail === 'string') {
        return data.detail;
      }
      return 'Conflito ao processar a requisição. O recurso pode já existir.';

    case 422:
      if (data && typeof data.detail === 'string') {
        return data.detail;
      }
      return 'Não foi possível processar a requisição. Verifique os dados enviados.';

    case 429:
      if (data && typeof data.detail === 'string') {
        return data.detail;
      }
      return 'Muitas requisições. Tente novamente mais tarde.';

    case 500:
      return 'Erro interno do servidor. Tente novamente mais tarde.';

    case 502:
      return 'Erro de comunicação com o servidor. Verifique sua conexão ou tente novamente mais tarde.';

    case 503:
      return 'Serviço indisponível. Tente novamente mais tarde.';

    case 504:
      return 'Tempo de resposta do servidor excedido. Tente novamente mais tarde.';

    default:
      return 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
  }
};

// Função para lidar com erros da API
export const handleApiError = async (response: Response): Promise<Response> => {
  if (!response.ok) {
    let errorData: Record<string, unknown> = {};
    const contentType = response.headers.get('content-type');

    // Tentar obter dados de erro do corpo da resposta
    try {
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json() as Record<string, unknown>;
        console.log('Erro da API (JSON):', errorData);
      } else {
        // Se não for JSON, tentar obter o texto
        const errorText = await response.text();
        console.log('Erro da API (texto):', errorText);
        errorData = { detail: errorText || 'Erro desconhecido' };
      }
    } catch (e) {
      // Se não for possível obter dados do corpo, usar um objeto com informações básicas
      console.warn('Não foi possível obter detalhes do erro da API:', e);
      errorData = {
        detail: 'Não foi possível obter detalhes do erro',
        originalError: e instanceof Error ? e.message : String(e)
      };
    }

    // Verificar se é um erro de rede
    if (!navigator.onLine) {
      errorData = {
        ...errorData,
        detail: 'Você está offline. Verifique sua conexão com a internet.'
      };
    }

    // Tratamento especial para erros de registro
    if (response.url.includes('/auth/users/') && response.status === 400) {
      console.log('Erro de registro detectado:', errorData);

      // Formatar mensagens de erro para campos específicos
      if (errorData && typeof errorData === 'object') {
        // Verificar erros de validação de formulário
        Object.entries(errorData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            console.log(`Erro no campo ${key}:`, value);
          }
        });
      }
    }

    // Criar objeto de erro padronizado
    const apiError: ApiError = {
      status: response.status,
      statusText: response.statusText,
      message: getErrorMessage(response.status, errorData),
      data: errorData,
      isApiError: true
    };

    // Registrar erro no console para depuração
    console.error('Erro na API:', apiError);

    // Verificar se é um erro de autenticação e redirecionar para login se necessário
    if (response.status === 401 && !window.location.pathname.includes('/login')) {
      // Limpar tokens expirados
      localStorage.removeItem('viixen_access_token');
      localStorage.removeItem('viixen_refresh_token');

      // Adicionar informação ao erro
      apiError.message = 'Sua sessão expirou. Você será redirecionado para a página de login.';

      // Redirecionar após um pequeno delay para permitir que a mensagem seja exibida
      setTimeout(() => {
        window.location.href = '/login?expired=true';
      }, 1500);
    }

    throw apiError;
  }

  return response;
};
