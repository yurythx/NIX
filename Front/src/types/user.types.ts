/**
 * Tipos relacionados a usuários
 */

/**
 * Interface para usuário
 */
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  bio?: string;
  position?: string;
  slug: string;
  created_at: string;
  updated_at: string;
  is_staff: boolean;
  is_active: boolean;
}

/**
 * Interface para login
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Interface para registro
 */
export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  re_password: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Interface para tokens de autenticação
 */
export interface AuthTokens {
  access: string;
  refresh: string;
}

/**
 * Interface para alteração de senha
 */
export interface PasswordChangeDto {
  current_password: string;
  new_password: string;
}

/**
 * Interface para atualização de perfil
 */
export interface UpdateProfileDto {
  first_name?: string;
  last_name?: string;
  bio?: string;
  position?: string;
  avatar?: File | null;
}
