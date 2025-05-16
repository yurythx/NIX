/**
 * Tipos relacionados a categorias
 */

/**
 * Interface para categoria
 */
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent?: number;
  created_at: string;
  updated_at: string;
  articles_count?: number;
}

/**
 * Interface para criação de categoria
 */
export interface CreateCategoryDto {
  name: string;
  description?: string;
  parent?: number;
}

/**
 * Interface para atualização de categoria
 */
export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  parent?: number;
}
