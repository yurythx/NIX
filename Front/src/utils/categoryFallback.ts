/**
 * Utilitário para fornecer categorias padrão quando a API falha
 */

// Tipo para categorias
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at?: string;
}

// Categorias padrão para uso quando a API falha
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Tecnologia', slug: 'tecnologia', description: 'Artigos sobre tecnologia', created_at: new Date().toISOString() },
  { id: 2, name: 'Programação', slug: 'programacao', description: 'Artigos sobre programação', created_at: new Date().toISOString() },
  { id: 3, name: 'Design', slug: 'design', description: 'Artigos sobre design', created_at: new Date().toISOString() },
  { id: 4, name: 'Marketing', slug: 'marketing', description: 'Artigos sobre marketing', created_at: new Date().toISOString() },
  { id: 5, name: 'Negócios', slug: 'negocios', description: 'Artigos sobre negócios', created_at: new Date().toISOString() },
  { id: 6, name: 'Mangá', slug: 'manga', description: 'Artigos sobre mangás', created_at: new Date().toISOString() },
  { id: 7, name: 'Anime', slug: 'anime', description: 'Artigos sobre animes', created_at: new Date().toISOString() },
  { id: 8, name: 'Games', slug: 'games', description: 'Artigos sobre jogos', created_at: new Date().toISOString() },
  { id: 9, name: 'Cultura', slug: 'cultura', description: 'Artigos sobre cultura', created_at: new Date().toISOString() },
];

// Cache em memória para categorias
interface CacheData {
  data: Category[];
  timestamp: number;
}

// Variável para armazenar o cache em memória
let categoriesCache: CacheData | null = null;

// Tempo de expiração do cache em milissegundos (10 minutos)
const CACHE_EXPIRATION_TIME = 10 * 60 * 1000;

/**
 * Função para limpar o cache de categorias
 * Útil quando uma categoria é criada, atualizada ou excluída
 */
export const clearCategoriesCache = (): void => {
  categoriesCache = null;
  console.log('Cache de categorias limpo');
};

/**
 * Função para obter categorias de forma segura
 * Tenta buscar da API e, se falhar, usa categorias padrão
 * Implementa cache para evitar requisições repetidas
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    // Verificar se estamos no navegador (client-side)
    if (typeof window === 'undefined') {
      // console.log('Executando no servidor, retornando categorias padrão');
      return DEFAULT_CATEGORIES;
    }

    // Verificar se há dados em cache válidos
    const now = Date.now();
    if (categoriesCache && (now - categoriesCache.timestamp < CACHE_EXPIRATION_TIME)) {
      // console.log('Usando categorias do cache');
      return categoriesCache.data;
    }

    // Se não há cache válido, buscar da API
    // console.log('Cache expirado ou não existente, buscando categorias da API');

    // Tentar buscar da API usando a URL correta
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    console.log(`Buscando categorias de: ${API_BASE_URL}/api/v1/categories/`);

    const response = await fetch(`${API_BASE_URL}/api/v1/categories/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Se a API retornar erro, usar dados padrão
    if (!response.ok) {
      console.error(`Erro ao buscar categorias. Status: ${response.status} ${response.statusText}`);
      console.log(`Usando categorias padrão (API indisponível). Status: ${response.status} ${response.statusText}`);

      // Armazenar categorias padrão no cache para evitar requisições repetidas
      categoriesCache = {
        data: DEFAULT_CATEGORIES,
        timestamp: now
      };

      return DEFAULT_CATEGORIES;
    }

    const data = await response.json();
    let categories: Category[] = DEFAULT_CATEGORIES;

    console.log('Resposta da API de categorias:', data);

    // Verificar se os dados retornados são uma resposta paginada
    if (data && typeof data === 'object' && 'results' in data) {
      console.log('Dados paginados detectados, usando data.results');
      categories = data.results;
    }
    // Verificar se os dados retornados são um array
    else if (Array.isArray(data)) {
      console.log('Array de categorias detectado');
      categories = data;
    }
    else {
      console.error('API retornou um formato inválido para categorias:', data);
    }

    // Armazenar no cache
    categoriesCache = {
      data: categories,
      timestamp: now
    };

    return categories;
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);

    // Registrar mais detalhes sobre o erro para depuração
    if (error instanceof Error) {
      console.error('Detalhes do erro:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }

    // Se já temos um cache, mesmo que expirado, usá-lo em vez de categorias padrão
    if (categoriesCache) {
      console.log('Usando cache expirado devido a erro na requisição');
      return categoriesCache.data;
    }

    // Armazenar categorias padrão no cache para evitar requisições repetidas
    categoriesCache = {
      data: DEFAULT_CATEGORIES,
      timestamp: Date.now()
    };

    return DEFAULT_CATEGORIES;
  }
};
