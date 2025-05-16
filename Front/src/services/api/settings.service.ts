import { API_BASE_URL, API_ENDPOINTS, getDefaultHeaders, handleApiError } from './config';
import { getAccessToken } from './auth.service';

// Tipos para as configurações
export interface CommentSettings {
  requireCommentApproval: boolean;
  allowAnonymousComments: boolean;
  notifyOnNewComments: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number; // em minutos
  loginNotifications: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  notifyOnNewArticles: boolean;
  notifyOnReplies: boolean;
  digestFrequency: 'daily' | 'weekly' | 'never';
}

export interface AccountSettings {
  displayName: string;
  bio: string;
  showEmail: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

export interface UserSettings {
  comments: CommentSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  account: AccountSettings;
}

// Valores padrão para as configurações
export const DEFAULT_SETTINGS: UserSettings = {
  comments: {
    requireCommentApproval: false,
    allowAnonymousComments: true,
    notifyOnNewComments: true
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 60,
    loginNotifications: true
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    notifyOnNewArticles: true,
    notifyOnReplies: true,
    digestFrequency: 'weekly'
  },
  account: {
    displayName: '',
    bio: '',
    showEmail: false,
    language: 'pt-BR',
    theme: 'dark'
  }
};

// Chave para armazenar as configurações no localStorage
const SETTINGS_STORAGE_KEY = 'user_settings';

/**
 * Carrega as configurações do localStorage
 */
export const loadSettingsFromLocalStorage = (): UserSettings => {
  try {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      return JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error('Erro ao carregar configurações do localStorage:', error);
  }

  // Se não houver configurações salvas ou ocorrer um erro, retornar as configurações padrão
  return DEFAULT_SETTINGS;
};

/**
 * Salva as configurações no localStorage
 */
export const saveSettingsToLocalStorage = (settings: UserSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Erro ao salvar configurações no localStorage:', error);
  }
};

/**
 * Carrega as configurações do servidor
 * Requer autenticação
 *
 * NOTA: Temporariamente usando apenas localStorage até que o back-end esteja pronto
 */
export const loadSettingsFromServer = async (): Promise<UserSettings> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    // TEMPORÁRIO: Usar apenas localStorage até que o back-end esteja pronto
    console.log('Usando localStorage temporariamente para carregar configurações');
    return loadSettingsFromLocalStorage();

    /* CÓDIGO ORIGINAL - Descomentar quando o back-end estiver pronto
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.SETTINGS}`, {
      method: 'GET',
      headers: getDefaultHeaders(token)
    });

    await handleApiError(response);
    const data = await response.json();

    // Converter o formato do back-end para o formato do front-end
    const settings: UserSettings = {
      comments: {
        requireCommentApproval: data.require_comment_approval,
        allowAnonymousComments: data.allow_anonymous_comments,
        notifyOnNewComments: data.notify_on_new_comments
      },
      security: {
        twoFactorEnabled: data.two_factor_enabled,
        sessionTimeout: data.session_timeout,
        loginNotifications: data.login_notifications
      },
      notifications: {
        emailNotifications: data.email_notifications,
        pushNotifications: data.push_notifications,
        notifyOnNewArticles: data.notify_on_new_articles,
        notifyOnReplies: data.notify_on_replies,
        digestFrequency: data.digest_frequency as 'daily' | 'weekly' | 'never'
      },
      account: {
        displayName: data.display_name,
        bio: data.user?.bio || '',
        showEmail: data.show_email,
        language: data.language,
        theme: data.theme as 'light' | 'dark' | 'system'
      }
    };

    return settings;
    */
  } catch (error) {
    console.error('Erro ao carregar configurações do servidor:', error);
    // Em caso de erro, retornar as configurações do localStorage
    return loadSettingsFromLocalStorage();
  }
};

/**
 * Salva as configurações no servidor
 * Requer autenticação
 *
 * NOTA: Temporariamente usando apenas localStorage até que o back-end esteja pronto
 */
export const saveSettingsToServer = async (settings: UserSettings): Promise<UserSettings> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    // TEMPORÁRIO: Usar apenas localStorage até que o back-end esteja pronto
    console.log('Usando localStorage temporariamente para salvar configurações');
    saveSettingsToLocalStorage(settings);

    // Simular um atraso de rede para dar feedback visual
    await new Promise(resolve => setTimeout(resolve, 500));

    return settings;

    /* CÓDIGO ORIGINAL - Descomentar quando o back-end estiver pronto
    // Converter o formato do front-end para o formato do back-end
    const backendSettings = {
      require_comment_approval: settings.comments.requireCommentApproval,
      allow_anonymous_comments: settings.comments.allowAnonymousComments,
      notify_on_new_comments: settings.comments.notifyOnNewComments,

      two_factor_enabled: settings.security.twoFactorEnabled,
      session_timeout: settings.security.sessionTimeout,
      login_notifications: settings.security.loginNotifications,

      email_notifications: settings.notifications.emailNotifications,
      push_notifications: settings.notifications.pushNotifications,
      notify_on_new_articles: settings.notifications.notifyOnNewArticles,
      notify_on_replies: settings.notifications.notifyOnReplies,
      digest_frequency: settings.notifications.digestFrequency,

      display_name: settings.account.displayName,
      show_email: settings.account.showEmail,
      language: settings.account.language,
      theme: settings.account.theme
    };

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.SETTINGS}`, {
      method: 'PUT',
      headers: getDefaultHeaders(token),
      body: JSON.stringify(backendSettings)
    });

    await handleApiError(response);

    // Também salvar no localStorage para acesso offline
    saveSettingsToLocalStorage(settings);

    return settings;
    */
  } catch (error) {
    console.error('Erro ao salvar configurações no servidor:', error);

    // TEMPORÁRIO: Salvar no localStorage mesmo em caso de erro
    saveSettingsToLocalStorage(settings);
    return settings;

    // Descomentar quando o back-end estiver pronto
    // throw error;
  }
};

/**
 * Sincroniza as configurações entre o localStorage e o servidor
 * Requer autenticação
 *
 * NOTA: Temporariamente usando apenas localStorage até que o back-end esteja pronto
 */
export const syncSettings = async (): Promise<UserSettings> => {
  try {
    // TEMPORÁRIO: Usar apenas localStorage até que o back-end esteja pronto
    console.log('Usando localStorage temporariamente para sincronizar configurações');
    const localSettings = loadSettingsFromLocalStorage();

    // Simular um atraso de rede para dar feedback visual
    await new Promise(resolve => setTimeout(resolve, 300));

    return localSettings;

    /* CÓDIGO ORIGINAL - Descomentar quando o back-end estiver pronto
    // Carregar configurações do servidor
    const serverSettings = await loadSettingsFromServer();

    // Salvar no localStorage
    saveSettingsToLocalStorage(serverSettings);

    return serverSettings;
    */
  } catch (error) {
    console.error('Erro ao sincronizar configurações:', error);
    // Em caso de erro, retornar as configurações do localStorage
    return loadSettingsFromLocalStorage();
  }
};

/**
 * Funções específicas para gerenciar as configurações de tema
 */

/**
 * Obtém as configurações de tema do localStorage
 */
export const getThemeSettings = () => {
  const settings = loadSettingsFromLocalStorage();

  // Verificar se há configurações específicas de tema no localStorage
  const theme = localStorage.getItem('theme') || settings.account.theme;
  const themeColor = localStorage.getItem('themeColor') || 'blue';
  const useSystemTheme = localStorage.getItem('useSystemTheme') === 'true';

  return {
    theme,
    theme_color: themeColor,
    use_system_theme: useSystemTheme
  };
};

/**
 * Salva as configurações de tema no localStorage e no servidor (se autenticado)
 */
export const saveThemeSettings = async (themeSettings: {
  theme: string,
  theme_color: string,
  use_system_theme: boolean
}) => {
  // Salvar no localStorage
  localStorage.setItem('theme', themeSettings.theme);
  localStorage.setItem('themeColor', themeSettings.theme_color);
  localStorage.setItem('useSystemTheme', themeSettings.use_system_theme.toString());

  // Atualizar as configurações gerais
  const settings = loadSettingsFromLocalStorage();
  settings.account.theme = themeSettings.theme as 'light' | 'dark' | 'system';
  saveSettingsToLocalStorage(settings);

  // Se o usuário estiver autenticado, tentar salvar no servidor
  const token = getAccessToken();
  if (token) {
    try {
      await saveSettingsToServer(settings);
    } catch (error) {
      console.error('Erro ao salvar configurações de tema no servidor:', error);
      // Já salvamos localmente, então não precisamos fazer nada aqui
    }
  }

  return themeSettings;
};
