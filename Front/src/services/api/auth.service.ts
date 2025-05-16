/**
 * Serviço de autenticação
 */
import { API_BASE_URL, API_ENDPOINTS, getDefaultHeaders, handleApiError } from './config';
import { AuthTokens, LoginData, LoginResponse, User, UserCreateData } from '../../types/models';

// Chaves para armazenamento local
const ACCESS_TOKEN_KEY = 'viixen_access_token';
const REFRESH_TOKEN_KEY = 'viixen_refresh_token';
const USER_KEY = 'viixen_user';

/**
 * Realiza login do usuário
 */
export const login = async (data: LoginData): Promise<LoginResponse> => {
  console.log('URL de login:', `${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`);
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
    method: 'POST',
    headers: getDefaultHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      statusText: response.statusText,
      data: errorData,
    };
  }

  const tokens: AuthTokens = await response.json();

  // Verificar o formato dos tokens
  if (!tokens.access || !tokens.refresh) {
    throw new Error('Formato de tokens inválido');
  }

  // Armazenar tokens
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);

  try {
    // Buscar dados do usuário
    const user = await getCurrentUser(tokens.access);

    // Armazenar dados do usuário
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return { tokens, user };
  } catch (error) {
    // Se não conseguir buscar os dados do usuário, fazer logout
    logout();
    throw error;
  }
};

/**
 * Realiza logout do usuário
 */
export const logout = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Registra um novo usuário
 */
export const register = async (data: UserCreateData): Promise<User> => {
  // Para enviar arquivos, precisamos usar FormData
  const formData = new FormData();

  // Adicionar campos ao FormData
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  console.log('Enviando dados de registro:', Object.fromEntries(formData.entries()));
  console.log('URL de registro:', `${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`);

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
      method: 'POST',
      body: formData,
      // Não definimos headers aqui porque o FormData define automaticamente o Content-Type
    });

    await handleApiError(response);
    const userData = await response.json();
    console.log('Resposta do registro:', userData);
    return userData;
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    throw error;
  }
};

/**
 * Obtém o usuário atual
 */
export const getCurrentUser = async (token?: string): Promise<User> => {
  const accessToken = token || localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!accessToken) {
    throw new Error('Usuário não autenticado');
  }

  const headers = getDefaultHeaders(accessToken);
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CURRENT_USER}`, {
    method: 'GET',
    headers: headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      statusText: response.statusText,
      data: errorData,
    };
  }

  const userData = await response.json();

  // Garantir que as propriedades is_staff e is_superuser estejam definidas
  if (userData) {
    // Definir valores padrão se não estiverem presentes
    userData.is_staff = userData.is_staff === true;
    userData.is_superuser = userData.is_superuser === true;
  }

  return userData;
};

/**
 * Verifica se o token é válido
 */
export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.VERIFY}`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({ token }),
    });

    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Atualiza o token de acesso usando o token de atualização
 */
export const refreshToken = async (): Promise<AuthTokens> => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    throw new Error('Token de atualização não encontrado');
  }

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
    method: 'POST',
    headers: getDefaultHeaders(),
    body: JSON.stringify({ refresh: refreshToken }),
  });

  await handleApiError(response);
  const tokens: AuthTokens = await response.json();

  // Atualizar token de acesso no armazenamento local
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);

  return tokens;
};

/**
 * Verifica se o usuário está autenticado
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!accessToken) {
    return false;
  }

  // Verificar se o token é válido
  const isValid = await verifyToken(accessToken);

  if (isValid) {
    return true;
  }

  // Se o token não for válido, tentar atualizar
  try {
    await refreshToken();
    return true;
  } catch (error) {
    // Se não conseguir atualizar, fazer logout
    logout();
    return false;
  }
};

/**
 * Obtém o token de acesso atual
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Obtém o usuário atual do armazenamento local
 */
export const getStoredUser = (): User | null => {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;

  try {
    const user = JSON.parse(userJson);

    // Garantir que as propriedades is_staff e is_superuser estejam definidas
    if (user) {
      // Definir valores padrão se não estiverem presentes
      user.is_staff = user.is_staff === true;
      user.is_superuser = user.is_superuser === true;
    }

    return user;
  } catch (error) {
    console.error('Erro ao analisar dados do usuário do localStorage:', error);
    return null;
  }
};
