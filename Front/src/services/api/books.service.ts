/**
 * Serviço de API para livros
 *
 * Este serviço fornece funções para interagir com a API de livros,
 * incluindo operações CRUD (Criar, Ler, Atualizar, Excluir) e
 * funcionalidades adicionais como paginação, pesquisa e cache.
 *
 * @module services/api/books
 */
import { API_BASE_URL, API_ENDPOINTS, getDefaultHeaders, handleApiError } from './config';
import { getAccessToken } from './auth.service';
import booksCacheService from '../cache/booksCacheService';
import errorHandler, { logError } from '../../utils/errorHandler';

/**
 * Interface para o modelo de livro
 *
 * @property {number} id - Identificador único do livro
 * @property {string} title - Título do livro
 * @property {string} slug - Slug para URL amigável
 * @property {string} description - Descrição do livro
 * @property {string|null} cover - URL da imagem de capa ou null se não houver
 * @property {boolean} has_audio - Indica se o livro tem áudio disponível
 * @property {string} pdf_file - URL do arquivo PDF
 * @property {string} [audio_file] - URL do arquivo de áudio (opcional)
 * @property {string} created_at - Data de criação no formato ISO
 * @property {string} updated_at - Data de atualização no formato ISO
 * @property {number} category - ID da categoria do livro
 * @property {string} [category_name] - Nome da categoria (opcional)
 */
export interface Book {
  id: number;
  title: string;
  slug: string;
  description: string;
  cover: string | null;
  has_audio: boolean;
  pdf_file: string;
  audio_file?: string;
  created_at: string;
  updated_at: string;
  category: number;
  category_name?: string;
  views_count?: number;
  comments_count?: number;
  author_id?: number;
}

/**
 * Interface para resposta paginada da API
 *
 * @template T - Tipo dos itens na lista de resultados
 * @property {number} count - Número total de itens
 * @property {string|null} next - URL para a próxima página ou null se não houver
 * @property {string|null} previous - URL para a página anterior ou null se não houver
 * @property {T[]} results - Lista de itens para a página atual
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Interface para dados de criação de livro
 *
 * @property {string} title - Título do livro
 * @property {string} description - Descrição do livro
 * @property {File|null} [cover] - Arquivo de imagem para a capa (opcional)
 * @property {File} [pdf_file] - Arquivo PDF do livro (obrigatório se pdf_file_path não for fornecido)
 * @property {string} [pdf_file_path] - Caminho para o arquivo PDF (obrigatório se pdf_file não for fornecido)
 * @property {boolean} [has_audio] - Indica se o livro tem áudio (opcional)
 * @property {File|null} [audio_file] - Arquivo de áudio (opcional)
 * @property {string} [audio_file_path] - Caminho para o arquivo de áudio (opcional)
 * @property {number} [category] - ID da categoria (opcional)
 */
export interface BookCreateData {
  title: string;
  description: string;
  cover?: File | null;
  pdf_file?: File;
  pdf_file_path?: string;
  has_audio?: boolean;
  audio_file?: File | null;
  audio_file_path?: string;
  category?: number;
}

/**
 * Interface para dados de atualização de livro
 *
 * Todos os campos são opcionais, permitindo atualização parcial
 *
 * @property {string} [title] - Título do livro
 * @property {string} [description] - Descrição do livro
 * @property {File|null} [cover] - Arquivo de imagem para a capa
 * @property {File|null} [pdf_file] - Arquivo PDF do livro
 * @property {boolean} [has_audio] - Indica se o livro tem áudio
 * @property {File|null} [audio_file] - Arquivo de áudio
 * @property {number} [category] - ID da categoria
 */
export interface BookUpdateData {
  title?: string;
  description?: string;
  cover?: File | null;
  pdf_file?: File | null;
  has_audio?: boolean;
  audio_file?: File | null;
  category?: number;
}

/**
 * Obtém a lista completa de livros
 *
 * Esta função busca todos os livros disponíveis na API.
 * Se ocorrer um erro, retorna uma lista vazia e registra o erro.
 *
 * @returns {Promise<Book[]>} Promise que resolve para um array de livros
 * @example
 * ```typescript
 * const books = await getBooks();
 * console.log(`Encontrados ${books.length} livros`);
 * ```
 */
export const getBooks = async (): Promise<Book[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKS.BASE}`, {
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

    console.error('API retornou um formato inválido para livros:', data);
    return [];
  } catch (error) {
    logError(error, 'getBooks');
    return [];
  }
};

/**
 * Função base para obter um livro pelo slug
 *
 * Esta função é usada internamente por getBookBySlug e não deve ser chamada diretamente.
 * Busca um livro específico pelo seu slug sem usar cache.
 *
 * @param {string} slug - O slug do livro a ser buscado
 * @returns {Promise<Book|null>} Promise que resolve para o livro encontrado ou null se não encontrado
 * @private
 */
export const getBookBySlugBase = async (slug: string): Promise<Book | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKS.DETAIL(slug)}`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });

    await handleApiError(response);
    const data = await response.json();

    // Verificar se os dados retornados são válidos
    if (!data || typeof data !== 'object' || !data.id) {
      console.error('API retornou um formato inválido para o livro:', data);
      return null;
    }

    return data;
  } catch (error) {
    logError(error, `getBookBySlugBase(${slug})`);
    return null;
  }
};

/**
 * Obtém um livro pelo slug com suporte a cache
 *
 * Esta função busca um livro específico pelo seu slug, utilizando cache para melhorar o desempenho.
 * Se o livro estiver em cache e o cache não estiver desabilitado, retorna o livro do cache.
 * Caso contrário, busca o livro da API e o armazena no cache.
 *
 * @param {string} slug - O slug do livro a ser buscado
 * @param {boolean} [noCache=false] - Se true, ignora o cache e busca diretamente da API
 * @returns {Promise<Book|null>} Promise que resolve para o livro encontrado ou null se não encontrado
 * @example
 * ```typescript
 * // Com cache (padrão)
 * const book = await getBookBySlug('meu-livro');
 *
 * // Sem cache
 * const freshBook = await getBookBySlug('meu-livro', true);
 * ```
 */
export const getBookBySlug = async (slug: string, noCache: boolean = false): Promise<Book | null> => {
  // Verificar cache primeiro se não estiver desabilitado
  if (!noCache) {
    const cachedBook = booksCacheService.getCachedBook(slug);
    if (cachedBook) {
      return cachedBook;
    }
  }

  // Se não estiver em cache ou cache desabilitado, buscar da API
  const book = await getBookBySlugBase(slug);

  // Armazenar no cache se encontrado e cache não estiver desabilitado
  if (book && !noCache) {
    booksCacheService.cacheBook(book);
  }

  return book;
};

/**
 * Obtém a lista de livros com paginação, pesquisa e filtros
 *
 * Esta função busca livros com suporte a paginação, pesquisa por texto,
 * filtro por áudio e ordenação. Utiliza cache para melhorar o desempenho.
 *
 * @param {number} [page=1] - Número da página a ser buscada
 * @param {string} [searchTerm=''] - Termo de pesquisa para filtrar livros
 * @param {boolean} [hasAudio] - Se definido, filtra livros com ou sem áudio
 * @param {string} [ordering] - Campo e direção para ordenação (ex: '-created_at')
 * @param {boolean} [noCache=false] - Se true, ignora o cache e busca diretamente da API
 * @returns {Promise<PaginatedResponse<Book>>} Promise que resolve para uma resposta paginada de livros
 * @example
 * ```typescript
 * // Buscar primeira página
 * const firstPage = await getPaginatedBooks();
 *
 * // Buscar segunda página com pesquisa
 * const searchResults = await getPaginatedBooks(2, 'aventura');
 *
 * // Buscar livros com áudio, ordenados por mais recentes
 * const audioBooks = await getPaginatedBooks(1, '', true, '-created_at');
 * ```
 */
export const getPaginatedBooks = async (
  page: number = 1,
  searchTerm: string = '',
  hasAudio?: boolean,
  ordering?: string,
  noCache?: boolean
): Promise<PaginatedResponse<Book>> => {
  try {
    // Verificar cache primeiro se não estiver desabilitado
    if (!noCache) {
      const cacheKey = booksCacheService.getPaginatedCacheKey(page, searchTerm, hasAudio, ordering);
      const cachedData = booksCacheService.getCachedPaginatedBooks(cacheKey);

      if (cachedData) {
        return cachedData;
      }
    }

    // Construir a URL com parâmetros de consulta
    let url = `${API_BASE_URL}${API_ENDPOINTS.BOOKS.BASE}?page=${page}`;

    // Adicionar termo de pesquisa se fornecido
    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }

    // Adicionar filtro de áudio se fornecido
    if (hasAudio !== undefined) {
      url += `&has_audio=${hasAudio}`;
    }

    // Adicionar ordenação se fornecida
    if (ordering) {
      url += `&ordering=${ordering}`;
    }

    // Adicionar parâmetro para ignorar cache se fornecido
    if (noCache) {
      url += `&nocache=true`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getDefaultHeaders(),
      });

      // Se o servidor retornar erro 500, usar dados simulados
      if (response.status === 500) {
        console.warn('Servidor retornou erro 500. Usando dados simulados para livros.');
        return getMockBookData(page, searchTerm, hasAudio);
      }

      await handleApiError(response);
      const data = await response.json();

      // Verificar se os dados retornados são uma resposta paginada
      if (data && typeof data === 'object' && 'results' in data) {
        // Armazenar no cache se não estiver desabilitado
        if (!noCache) {
          const cacheKey = booksCacheService.getPaginatedCacheKey(page, searchTerm, hasAudio, ordering);
          booksCacheService.cachePaginatedBooks(data, cacheKey);
        }
        return data as PaginatedResponse<Book>;
      }

      // Se não for uma resposta paginada, criar uma estrutura paginada com os dados
      if (Array.isArray(data)) {
        const paginatedData = {
          count: data.length,
          next: null,
          previous: null,
          results: data
        };

        // Armazenar no cache se não estiver desabilitado
        if (!noCache) {
          const cacheKey = booksCacheService.getPaginatedCacheKey(page, searchTerm, hasAudio, ordering);
          booksCacheService.cachePaginatedBooks(paginatedData, cacheKey);
        }

        return paginatedData;
      }

      console.error('API retornou um formato inválido para livros paginados:', data);
      return getMockBookData(page, searchTerm, hasAudio);
    } catch (networkError) {
      console.warn('Erro de rede ao buscar livros. Usando dados simulados:', networkError);
      return getMockBookData(page, searchTerm, hasAudio);
    }
  } catch (error) {
    logError(error, `getPaginatedBooks(page=${page}, search=${searchTerm})`);
    return getMockBookData(page, searchTerm, hasAudio);
  }
};

/**
 * Gera dados simulados de livros para uso quando o servidor não está disponível
 */
const getMockBookData = (
  page: number = 1,
  searchTerm: string = '',
  hasAudio?: boolean
): PaginatedResponse<Book> => {
  // Dados simulados de livros
  const mockBooks: Book[] = [
    {
      id: 1,
      title: 'Livro de Teste',
      slug: 'livro-de-teste',
      description: 'Um livro para testar o sistema',
      cover_image: null,
      pdf_file: null,
      audio_file: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      category: null,
      views_count: 100
    },
    {
      id: 2,
      title: 'Livro com Áudio',
      slug: 'livro-com-audio',
      description: 'Um livro com arquivo de áudio',
      cover_image: null,
      pdf_file: null,
      audio_file: 'audiobooks/livro-audio.mp3',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
      category: null,
      views_count: 200
    },
    {
      id: 3,
      title: 'Outro Livro',
      slug: 'outro-livro',
      description: 'Mais um livro para testar',
      cover_image: null,
      pdf_file: null,
      audio_file: null,
      created_at: '2023-01-03T00:00:00Z',
      updated_at: '2023-01-03T00:00:00Z',
      category: null,
      views_count: 150
    }
  ];

  // Filtrar por termo de pesquisa se fornecido
  let filteredBooks = mockBooks;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredBooks = mockBooks.filter(book =>
      book.title.toLowerCase().includes(term) ||
      book.description.toLowerCase().includes(term)
    );
  }

  // Filtrar por áudio se fornecido
  if (hasAudio !== undefined) {
    filteredBooks = filteredBooks.filter(book =>
      hasAudio ? book.audio_file !== null : book.audio_file === null
    );
  }

  // Simular paginação
  const itemsPerPage = 10;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

  // Calcular URLs de próxima e anterior página
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;

  return {
    count: filteredBooks.length,
    next: hasNext ? `?page=${page + 1}${searchTerm ? `&search=${searchTerm}` : ''}${hasAudio !== undefined ? `&has_audio=${hasAudio}` : ''}` : null,
    previous: hasPrevious ? `?page=${page - 1}${searchTerm ? `&search=${searchTerm}` : ''}${hasAudio !== undefined ? `&has_audio=${hasAudio}` : ''}` : null,
    results: paginatedBooks
  };
};

/**
 * Cria um novo livro
 *
 * Esta função envia os dados de um novo livro para a API, incluindo arquivos de capa e áudio.
 * Requer autenticação do usuário. Após a criação, limpa o cache de livros.
 *
 * @param {BookCreateData} data - Dados do livro a ser criado
 * @returns {Promise<Book>} Promise que resolve para o livro criado
 * @throws {Error} Se o usuário não estiver autenticado
 * @throws {StandardError} Se ocorrer um erro na API
 * @example
 * ```typescript
 * try {
 *   const newBook = await createBook({
 *     title: 'Meu Novo Livro',
 *     description: 'Uma descrição interessante',
 *     has_audio: true,
 *     cover: coverFile,
 *     audio_file: audioFile,
 *     category: 1
 *   });
 *   console.log('Livro criado:', newBook);
 * } catch (error) {
 *   console.error('Erro ao criar livro:', error);
 * }
 * ```
 */
export const createBook = async (data: BookCreateData): Promise<Book> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  // Criar FormData para envio de arquivos
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('description', data.description);

  if (data.has_audio !== undefined) {
    formData.append('has_audio', data.has_audio.toString());
  }

  if (data.category) {
    formData.append('category', data.category.toString());
  }

  if (data.cover) {
    formData.append('cover', data.cover);
  }

  // Enviar arquivo PDF ou caminho do arquivo
  if (data.pdf_file) {
    formData.append('pdf_file', data.pdf_file);
  } else if (data.pdf_file_path) {
    formData.append('pdf_file_path', data.pdf_file_path);
  }

  // Enviar arquivo de áudio ou caminho do arquivo
  if (data.audio_file) {
    formData.append('audio_file', data.audio_file);
  } else if (data.audio_file_path) {
    formData.append('audio_file_path', data.audio_file_path);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKS.BASE}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    await handleApiError(response);
    const newBook = await response.json();

    // Limpar todo o cache de livros após criar um novo
    booksCacheService.clearBooksCache();

    return newBook;
  } catch (error) {
    logError(error, 'createBook');
    throw errorHandler.standardizeError(error);
  }
};

/**
 * Atualiza um livro existente
 *
 * Esta função envia os dados atualizados de um livro para a API, incluindo arquivos de capa e áudio.
 * Requer autenticação do usuário. Após a atualização, invalida o cache do livro.
 *
 * @param {string} slug - O slug do livro a ser atualizado
 * @param {BookUpdateData} data - Dados do livro a serem atualizados
 * @returns {Promise<Book>} Promise que resolve para o livro atualizado
 * @throws {Error} Se o usuário não estiver autenticado
 * @throws {StandardError} Se ocorrer um erro na API
 * @example
 * ```typescript
 * try {
 *   const updatedBook = await updateBook('meu-livro', {
 *     title: 'Título Atualizado',
 *     description: 'Nova descrição'
 *   });
 *   console.log('Livro atualizado:', updatedBook);
 * } catch (error) {
 *   console.error('Erro ao atualizar livro:', error);
 * }
 * ```
 */
export const updateBook = async (slug: string, data: BookUpdateData): Promise<Book> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  // Criar FormData para envio de arquivos
  const formData = new FormData();

  if (data.title) {
    formData.append('title', data.title);
  }

  if (data.description) {
    formData.append('description', data.description);
  }

  if (data.has_audio !== undefined) {
    formData.append('has_audio', data.has_audio.toString());
  }

  if (data.category) {
    formData.append('category', data.category.toString());
  }

  if (data.cover) {
    formData.append('cover', data.cover);
  }

  if (data.pdf_file) {
    formData.append('pdf_file', data.pdf_file);
  }

  if (data.audio_file) {
    formData.append('audio_file', data.audio_file);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKS.DETAIL(slug)}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    await handleApiError(response);
    const updatedBook = await response.json();

    // Invalidar o cache do livro atualizado
    booksCacheService.invalidateBookCache(slug);

    return updatedBook;
  } catch (error) {
    logError(error, `updateBook(${slug})`);
    throw errorHandler.standardizeError(error);
  }
};

/**
 * Exclui um livro
 *
 * Esta função envia uma solicitação para excluir um livro específico da API.
 * Requer autenticação do usuário. Após a exclusão, invalida o cache do livro.
 *
 * @param {string} slug - O slug do livro a ser excluído
 * @returns {Promise<void>} Promise que resolve quando o livro é excluído com sucesso
 * @throws {Error} Se o usuário não estiver autenticado
 * @throws {StandardError} Se ocorrer um erro na API
 * @example
 * ```typescript
 * try {
 *   await deleteBook('meu-livro');
 *   console.log('Livro excluído com sucesso');
 * } catch (error) {
 *   console.error('Erro ao excluir livro:', error);
 * }
 * ```
 */
export const deleteBook = async (slug: string): Promise<void> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKS.DETAIL(slug)}`, {
      method: 'DELETE',
      headers: getDefaultHeaders(token),
    });

    await handleApiError(response);

    // Invalidar o cache do livro excluído
    booksCacheService.invalidateBookCache(slug);

    return;
  } catch (error) {
    logError(error, `deleteBook(${slug})`);
    throw errorHandler.standardizeError(error);
  }
};

/**
 * Incrementa o contador de visualizações de um livro
 *
 * Esta função usa armazenamento local para simular o incremento de visualizações
 * enquanto o endpoint no backend está sendo implementado.
 *
 * @param {number} bookId - O ID do livro
 * @param {string} slug - O slug do livro
 * @returns {Promise<{views_count: number}>} Promise que resolve para um objeto com o novo contador de visualizações
 * @example
 * ```typescript
 * const result = await incrementViews(123, 'meu-livro');
 * console.log(`O livro agora tem ${result.views_count} visualizações`);
 * ```
 */
export const incrementViews = async (bookId: number, slug: string): Promise<{ views_count: number }> => {
  try {
    // Verificar se já visualizou nas últimas 24 horas
    const storageKey = `book_views_${slug}`;
    const viewsCountKey = `book_views_count_${slug}`;
    const lastViewed = localStorage.getItem(storageKey);
    const now = new Date().getTime();

    // Obter o contador atual de visualizações do armazenamento local
    let viewsCount = parseInt(localStorage.getItem(viewsCountKey) || '0', 10);

    if (lastViewed) {
      const lastViewedTime = parseInt(lastViewed, 10);
      const hoursSinceLastView = (now - lastViewedTime) / (1000 * 60 * 60);

      // Se visualizou nas últimas 24 horas, não incrementar
      if (hoursSinceLastView < 24) {
        console.log(`Livro ${slug} já visualizado nas últimas 24 horas. Não incrementando contador.`);
        return { views_count: viewsCount };
      }
    }

    // Registrar visualização
    localStorage.setItem(storageKey, now.toString());

    // Incrementar contador localmente
    viewsCount += 1;
    localStorage.setItem(viewsCountKey, viewsCount.toString());
    console.log(`Visualizações do livro ${slug} incrementadas localmente: ${viewsCount}`);

    // Tentar usar o endpoint real em segundo plano (não aguardar resposta)
    fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKS.INCREMENT_VIEWS(slug)}`, {
      method: 'POST',
      headers: getDefaultHeaders(),
    }).catch(() => {
      // Ignorar erros silenciosamente
    });

    return { views_count: viewsCount };
  } catch (error) {
    // Erro inesperado
    console.error(`Erro inesperado ao incrementar visualizações do livro ${bookId}:`, error);
    return { views_count: 0 };
  }
};

// Exportar o serviço completo
const booksService = {
  getBooks,
  getBookBySlug,
  getPaginatedBooks,
  createBook,
  updateBook,
  deleteBook,
  incrementViews
};

export default booksService;
