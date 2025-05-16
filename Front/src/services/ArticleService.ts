/**
 * Serviço para artigos
 * Implementa o padrão de serviço para encapsular a lógica de negócios relacionada a artigos
 */

import { articleRepository } from '../../../repositories/ArticleRepository';
import { Article, ArticleComment } from '../../../types/article.types';

/**
 * Serviço para artigos
 */
export class ArticleService {
  private repository = articleRepository;

  /**
   * Obtém todos os artigos
   */
  async getAllArticles(): Promise<Article[]> {
    return this.repository.getAll();
  }

  /**
   * Obtém um artigo pelo slug
   * Incrementa o contador de visualizações automaticamente
   */
  async getArticleBySlug(slug: string): Promise<Article> {
    const article = await this.repository.getBySlug(slug);
    
    // Incrementar visualizações
    this.repository.incrementViews(slug).catch(error => {
      console.warn('Erro ao incrementar visualizações:', error);
    });
    
    return article;
  }

  /**
   * Obtém artigos em destaque
   */
  async getFeaturedArticles(): Promise<Article[]> {
    return this.repository.getFeatured();
  }

  /**
   * Obtém artigos populares
   */
  async getPopularArticles(): Promise<Article[]> {
    return this.repository.getPopular();
  }

  /**
   * Obtém artigos recentes
   */
  async getRecentArticles(): Promise<Article[]> {
    return this.repository.getRecent();
  }

  /**
   * Obtém comentários de um artigo
   */
  async getArticleComments(articleId: number): Promise<ArticleComment[]> {
    return this.repository.getComments(articleId);
  }

  /**
   * Adiciona um comentário a um artigo
   */
  async addArticleComment(articleId: number, comment: Partial<ArticleComment>): Promise<ArticleComment> {
    return this.repository.addComment(articleId, comment);
  }

  /**
   * Favorita ou desfavorita um artigo
   * Retorna o novo estado (favoritado ou não)
   */
  async toggleArticleFavorite(slug: string): Promise<boolean> {
    const result = await this.repository.toggleFavorite(slug);
    return result.is_favorite;
  }

  /**
   * Obtém artigos favoritados pelo usuário atual
   */
  async getFavoriteArticles(): Promise<Article[]> {
    return this.repository.getFavorites();
  }

  /**
   * Filtra artigos por categoria
   */
  async getArticlesByCategory(categorySlug: string): Promise<Article[]> {
    const allArticles = await this.repository.getAll();
    return allArticles.filter(article => 
      article.categories.some(category => category.slug === categorySlug)
    );
  }

  /**
   * Pesquisa artigos por termo
   */
  async searchArticles(term: string): Promise<Article[]> {
    const allArticles = await this.repository.getAll();
    const searchTerm = term.toLowerCase();
    
    return allArticles.filter(article => 
      article.title.toLowerCase().includes(searchTerm) || 
      article.content.toLowerCase().includes(searchTerm) ||
      article.categories.some(category => category.name.toLowerCase().includes(searchTerm))
    );
  }
}

// Exportar uma instância única do serviço (Singleton)
export const articleService = new ArticleService();
