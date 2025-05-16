/**
 * Testes para o serviço de comentários unificado
 */

import { ContentType, getComments, createComment, deleteComment } from '../services/api/unified-comments.service';
import { API_BASE_URL, API_ENDPOINTS } from '../services/api/config';

// Mock do fetch global
global.fetch = jest.fn();

// Mock do localStorage para tokens
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
});

describe('Serviço de Comentários Unificado', () => {
  beforeEach(() => {
    // Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();
    
    // Mock do localStorage para retornar um token de acesso
    window.localStorage.getItem = jest.fn().mockImplementation((key) => {
      if (key === 'viixen_access_token') {
        return 'fake-token';
      }
      return null;
    });
  });

  describe('getComments', () => {
    it('deve buscar comentários de artigos corretamente', async () => {
      // Configurar o mock do fetch para retornar dados de comentários
      const mockComments = [
        {
          id: 1,
          text: 'Comentário de teste',
          created_at: '2023-01-01T12:00:00Z',
          name: 'Usuário Teste',
          email: 'teste@example.com',
          replies: []
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComments,
      });

      // Chamar a função getComments
      const result = await getComments(ContentType.ARTICLE, 'artigo-teste');

      // Verificar se fetch foi chamado com os parâmetros corretos
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_ENDPOINTS.ARTICLES.COMMENTS}?article_slug=artigo-teste`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Object),
        })
      );

      // Verificar se o resultado foi normalizado corretamente
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('content', 'Comentário de teste');
      expect(result[0]).toHaveProperty('name', 'Usuário Teste');
    });

    it('deve buscar comentários de livros corretamente', async () => {
      // Configurar o mock do fetch para retornar dados de comentários
      const mockComments = [
        {
          id: 1,
          content: 'Comentário de teste para livro',
          created_at: '2023-01-01T12:00:00Z',
          user: {
            id: 1,
            username: 'usuario_teste',
            avatar: 'avatar.jpg'
          },
          replies: []
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComments,
      });

      // Chamar a função getComments
      const result = await getComments(ContentType.BOOK, 'livro-teste');

      // Verificar se fetch foi chamado com os parâmetros corretos
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_ENDPOINTS.BOOKS.BOOK_COMMENTS('livro-teste')}`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Object),
        })
      );

      // Verificar se o resultado foi normalizado corretamente
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('content', 'Comentário de teste para livro');
      expect(result[0].user).toHaveProperty('username', 'usuario_teste');
    });

    it('deve lidar com erros ao buscar comentários', async () => {
      // Configurar o mock do fetch para retornar um erro
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Erro de rede'));

      // Chamar a função getComments
      const result = await getComments(ContentType.MANGA, 'manga-teste');

      // Verificar se o resultado é um array vazio
      expect(result).toEqual([]);
    });

    it('deve validar o ID do conteúdo', async () => {
      // Chamar a função getComments com um ID inválido
      const result = await getComments(ContentType.CHAPTER, undefined as any);

      // Verificar se o resultado é um array vazio
      expect(result).toEqual([]);
      // Verificar se fetch não foi chamado
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('createComment', () => {
    it('deve criar um comentário para artigo corretamente', async () => {
      // Configurar o mock do fetch para retornar dados do comentário criado
      const mockResponse = {
        id: 1,
        text: 'Novo comentário',
        created_at: '2023-01-01T12:00:00Z',
        name: 'Usuário Teste',
        email: 'teste@example.com',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Dados do comentário
      const commentData = {
        content: 'Novo comentário',
        name: 'Usuário Teste',
        email: 'teste@example.com',
      };

      // Chamar a função createComment
      await createComment(ContentType.ARTICLE, 'artigo-teste', commentData);

      // Verificar se fetch foi chamado com os parâmetros corretos
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_ENDPOINTS.ARTICLES.COMMENTS}`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-token',
          }),
          body: JSON.stringify({
            text: 'Novo comentário',
            article_slug: 'artigo-teste',
            name: 'Usuário Teste',
            email: 'teste@example.com',
          }),
        })
      );
    });

    it('deve lidar com erros ao criar comentários', async () => {
      // Configurar o mock do fetch para retornar um erro
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Erro de rede'));

      // Dados do comentário
      const commentData = {
        content: 'Novo comentário',
      };

      // Chamar a função createComment e verificar se lança um erro
      await expect(createComment(ContentType.BOOK, 'livro-teste', commentData))
        .rejects.toThrow();
    });
  });

  describe('deleteComment', () => {
    it('deve excluir um comentário corretamente', async () => {
      // Configurar o mock do fetch para retornar sucesso
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      // Chamar a função deleteComment
      await deleteComment(1);

      // Verificar se fetch foi chamado com os parâmetros corretos
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${API_ENDPOINTS.COMMENTS.DETAIL(1)}`,
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token',
          }),
        })
      );
    });

    it('deve exigir autenticação para excluir comentários', async () => {
      // Mock do localStorage para retornar null (sem token)
      window.localStorage.getItem = jest.fn().mockReturnValue(null);

      // Chamar a função deleteComment e verificar se lança um erro
      await expect(deleteComment(1))
        .rejects.toThrow('Usuário não autenticado');

      // Verificar se fetch não foi chamado
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
