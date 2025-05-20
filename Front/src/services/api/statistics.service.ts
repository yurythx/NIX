/**
 * Serviço de estatísticas
 */
import { API_BASE_URL, getDefaultHeaders, handleApiError } from './config';

// Interface para estatísticas globais
export interface GlobalStatistics {
  articles: {
    total: number;
    views: number;
    recent: number;
    most_viewed: Array<{
      title: string;
      slug: string;
      views_count: number;
    }>;
  };
  books: {
    total: number;
    views: number;
    recent: number;
    most_viewed: Array<{
      title: string;
      slug: string;
      views_count: number;
    }>;
  };
  mangas: {
    total: number;
    views: number;
    chapters: number;
    recent: number;
    most_viewed: Array<{
      title: string;
      slug: string;
      views_count: number;
    }>;
  };
  users: {
    total: number;
    active: number;
  };
  general: {
    total_content: number;
    total_views: number;
  };
  timestamp: string;
}

/**
 * Obtém estatísticas globais do sistema
 */
export const getGlobalStatistics = async (): Promise<GlobalStatistics> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/global-stats/`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });

    await handleApiError(response);
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar estatísticas globais:', error);
    // Retornar dados simulados em caso de erro
    return getMockStatistics();
  }
};

/**
 * Gera estatísticas simuladas para uso quando o servidor não está disponível
 */
export const getMockStatistics = (): GlobalStatistics => {
  return {
    articles: {
      total: 25,
      views: 1250,
      recent: 8,
      most_viewed: [
        { title: 'Artigo Popular 1', slug: 'artigo-popular-1', views_count: 350 },
        { title: 'Artigo Popular 2', slug: 'artigo-popular-2', views_count: 280 },
        { title: 'Artigo Popular 3', slug: 'artigo-popular-3', views_count: 220 },
        { title: 'Artigo Popular 4', slug: 'artigo-popular-4', views_count: 185 },
        { title: 'Artigo Popular 5', slug: 'artigo-popular-5', views_count: 150 },
      ],
    },
    books: {
      total: 15,
      views: 750,
      recent: 5,
      most_viewed: [
        { title: 'Livro Popular 1', slug: 'livro-popular-1', views_count: 180 },
        { title: 'Livro Popular 2', slug: 'livro-popular-2', views_count: 150 },
        { title: 'Livro Popular 3', slug: 'livro-popular-3', views_count: 120 },
        { title: 'Livro Popular 4', slug: 'livro-popular-4', views_count: 95 },
        { title: 'Livro Popular 5', slug: 'livro-popular-5', views_count: 80 },
      ],
    },
    mangas: {
      total: 30,
      views: 2000,
      chapters: 150,
      recent: 12,
      most_viewed: [
        { title: 'Mangá Popular 1', slug: 'manga-popular-1', views_count: 450 },
        { title: 'Mangá Popular 2', slug: 'manga-popular-2', views_count: 380 },
        { title: 'Mangá Popular 3', slug: 'manga-popular-3', views_count: 320 },
        { title: 'Mangá Popular 4', slug: 'manga-popular-4', views_count: 280 },
        { title: 'Mangá Popular 5', slug: 'manga-popular-5', views_count: 240 },
      ],
    },
    users: {
      total: 100,
      active: 45,
    },
    general: {
      total_content: 70,
      total_views: 4000,
    },
    timestamp: new Date().toISOString(),
  };
};

// Exportar o serviço completo
const statisticsService = {
  getGlobalStatistics,
  getMockStatistics,
};

export default statisticsService;
