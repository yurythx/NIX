/**
 * Tipos relacionados a artigos
 */

import { User } from './user.types';
import { Category } from './category.types';

/**
 * Interface para artigo
 */
export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  author: User;
  categories: Category[];
  tags: string[];
  created_at: string;
  updated_at: string;
  published_at: string;
  is_published: boolean;
  is_featured: boolean;
  views_count: number;
  comments_count: number;
  reading_time: number;
  is_favorite?: boolean;
}

/**
 * Interface para comentário de artigo
 */
export interface ArticleComment {
  id: number;
  article: number;
  parent?: number;
  author?: User;
  author_name?: string;
  author_email?: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_approved: boolean;
  replies?: ArticleComment[];
}

/**
 * Interface para criação de artigo
 */
export interface CreateArticleDto {
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: File | null;
  categories: number[];
  tags?: string[];
  is_published?: boolean;
  is_featured?: boolean;
}

/**
 * Interface para atualização de artigo
 */
export interface UpdateArticleDto {
  title?: string;
  content?: string;
  excerpt?: string;
  featured_image?: File | null;
  categories?: number[];
  tags?: string[];
  is_published?: boolean;
  is_featured?: boolean;
}

/**
 * Interface para criação de comentário
 */
export interface CreateCommentDto {
  content: string;
  parent?: number;
  author_name?: string;
  author_email?: string;
}

/**
 * Interface para resposta de favoritar/desfavoritar
 */
export interface FavoriteResponse {
  is_favorite: boolean;
}
