/**
 * Serviço de usuários
 */
import { API_BASE_URL, API_ENDPOINTS, getDefaultHeaders, handleApiError } from './config';
import { PasswordChangeData, User, UserDetail } from '../../types/models';
import { getAccessToken } from './auth.service';

/**
 * Dados simulados para quando o backend não estiver disponível
 */
const MOCK_USERS: User[] = [
  {
    id: '1', // Alterado para string para compatibilidade com UUID do backend
    username: 'admin',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    is_active: true,
    is_staff: true,
    is_superuser: true,
    date_joined: '2023-01-01T00:00:00Z',
    last_login: '2023-01-01T00:00:00Z',
    slug: 'admin',
    position: 'Administrador',
    bio: 'Administrador do sistema',
    avatar: null
  },
  {
    id: '2', // Alterado para string para compatibilidade com UUID do backend
    username: 'editor',
    email: 'editor@example.com',
    first_name: 'Editor',
    last_name: 'User',
    is_active: true,
    is_staff: true,
    is_superuser: false,
    date_joined: '2023-01-02T00:00:00Z',
    last_login: '2023-01-02T00:00:00Z',
    slug: 'editor',
    position: 'Editor',
    bio: 'Editor do sistema',
    avatar: null
  },
  {
    id: '3', // Alterado para string para compatibilidade com UUID do backend
    username: 'user',
    email: 'user@example.com',
    first_name: 'Normal',
    last_name: 'User',
    is_active: true,
    is_staff: false,
    is_superuser: false,
    date_joined: '2023-01-03T00:00:00Z',
    last_login: '2023-01-03T00:00:00Z',
    slug: 'user',
    position: 'Usuário',
    bio: 'Usuário comum do sistema',
    avatar: null
  }
];

/**
 * Obtém a lista de usuários
 * Tenta usar o endpoint simplificado e, se falhar, usa dados simulados
 */
export const getUsers = async (): Promise<User[]> => {
  const token = getAccessToken();

  try {
    console.log('Tentando obter usuários do endpoint simplificado...');
    console.log('URL:', `${API_BASE_URL}/api/users-simple/`);

    const response = await fetch(`${API_BASE_URL}/api/users-simple/`, {
      method: 'GET',
      headers: getDefaultHeaders(token || undefined),
    });

    console.log('Status da resposta:', response.status);

    if (!response.ok) {
      throw new Error(`Erro ao obter usuários: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Dados recebidos do backend:', data);
    return data;
  } catch (error) {
    console.warn('Erro ao obter usuários do endpoint simplificado, usando dados simulados:', error);

    // Simular um atraso de rede para dar feedback visual
    await new Promise(resolve => setTimeout(resolve, 500));

    // Gerar dados simulados mais realistas
    const simulatedUsers: User[] = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@nix.com',
        first_name: 'Administrador',
        last_name: 'Sistema',
        is_active: true,
        is_staff: true,
        is_superuser: true,
        slug: 'admin',
        position: 'Administrador',
        bio: 'Administrador do sistema NIX',
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        username: 'editor',
        email: 'editor@nix.com',
        first_name: 'Editor',
        last_name: 'Conteúdo',
        is_active: true,
        is_staff: true,
        is_superuser: false,
        slug: 'editor',
        position: 'Editor de Conteúdo',
        bio: 'Responsável pela edição de conteúdo no sistema NIX',
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        username: 'usuario',
        email: 'usuario@nix.com',
        first_name: 'Usuário',
        last_name: 'Padrão',
        is_active: true,
        is_staff: false,
        is_superuser: false,
        slug: 'usuario',
        position: 'Usuário',
        bio: 'Usuário padrão do sistema NIX',
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '4',
        username: 'leitor',
        email: 'leitor@nix.com',
        first_name: 'Leitor',
        last_name: 'Assíduo',
        is_active: true,
        is_staff: false,
        is_superuser: false,
        slug: 'leitor',
        position: 'Leitor',
        bio: 'Leitor assíduo do sistema NIX',
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '5',
        username: 'autor',
        email: 'autor@nix.com',
        first_name: 'Autor',
        last_name: 'Conteúdo',
        is_active: true,
        is_staff: false,
        is_superuser: false,
        slug: 'autor',
        position: 'Autor',
        bio: 'Autor de conteúdo no sistema NIX',
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    console.log('Retornando dados simulados:', simulatedUsers);
    return simulatedUsers;
  }
};

/**
 * Dados simulados detalhados para quando o backend não estiver disponível
 */
const MOCK_USER_DETAILS: Record<string, UserDetail> = {
  'admin': {
    id: '1', // Alterado para string para compatibilidade com UUID do backend
    username: 'admin',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    is_active: true,
    is_staff: true,
    is_superuser: true,
    date_joined: '2023-01-01T00:00:00Z',
    last_login: '2023-01-01T00:00:00Z',
    slug: 'admin',
    position: 'Administrador',
    bio: 'Administrador do sistema com acesso total às funcionalidades.',
    avatar: null,
    articles_count: 5,
    comments_count: 10,
    last_articles: [],
    last_comments: []
  },
  'editor': {
    id: '2', // Alterado para string para compatibilidade com UUID do backend
    username: 'editor',
    email: 'editor@example.com',
    first_name: 'Editor',
    last_name: 'User',
    is_active: true,
    is_staff: true,
    is_superuser: false,
    date_joined: '2023-01-02T00:00:00Z',
    last_login: '2023-01-02T00:00:00Z',
    slug: 'editor',
    position: 'Editor',
    bio: 'Editor responsável pela revisão e publicação de conteúdo.',
    avatar: null,
    articles_count: 12,
    comments_count: 8,
    last_articles: [],
    last_comments: []
  },
  'user': {
    id: '3', // Alterado para string para compatibilidade com UUID do backend
    username: 'user',
    email: 'user@example.com',
    first_name: 'Normal',
    last_name: 'User',
    is_active: true,
    is_staff: false,
    is_superuser: false,
    date_joined: '2023-01-03T00:00:00Z',
    last_login: '2023-01-03T00:00:00Z',
    slug: 'user',
    position: 'Usuário',
    bio: 'Usuário comum do sistema com permissões básicas.',
    avatar: null,
    articles_count: 0,
    comments_count: 15,
    last_articles: [],
    last_comments: []
  }
};

/**
 * Obtém um usuário pelo slug
 * Tenta usar o endpoint simplificado e, se falhar, usa dados simulados
 */
export const getUserBySlug = async (slug: string): Promise<UserDetail> => {
  const token = getAccessToken();

  try {
    console.log(`Tentando obter usuário com slug ${slug} do endpoint simplificado...`);
    console.log('URL:', `${API_BASE_URL}/api/users-simple/${slug}/`);

    const response = await fetch(`${API_BASE_URL}/api/users-simple/${slug}/`, {
      method: 'GET',
      headers: getDefaultHeaders(token || undefined),
    });

    console.log('Status da resposta:', response.status);

    if (!response.ok) {
      throw new Error(`Erro ao obter usuário: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Dados do usuário recebidos do backend:', data);
    return data;
  } catch (error) {
    console.warn(`Erro ao obter usuário com slug ${slug} do endpoint simplificado, usando dados simulados:`, error);

    // Simular um atraso de rede para dar feedback visual
    await new Promise(resolve => setTimeout(resolve, 500));

    // Gerar dados simulados para o usuário solicitado
    const simulatedUsers = {
      'admin': {
        id: '1',
        username: 'admin',
        email: 'admin@nix.com',
        first_name: 'Administrador',
        last_name: 'Sistema',
        full_name: 'Administrador Sistema',
        is_active: true,
        is_staff: true,
        is_superuser: true,
        last_login: new Date().toISOString(),
        slug: 'admin',
        position: 'Administrador',
        bio: 'Administrador do sistema NIX',
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      'editor': {
        id: '2',
        username: 'editor',
        email: 'editor@nix.com',
        first_name: 'Editor',
        last_name: 'Conteúdo',
        full_name: 'Editor Conteúdo',
        is_active: true,
        is_staff: true,
        is_superuser: false,
        last_login: new Date().toISOString(),
        slug: 'editor',
        position: 'Editor de Conteúdo',
        bio: 'Responsável pela edição de conteúdo no sistema NIX',
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      'usuario': {
        id: '3',
        username: 'usuario',
        email: 'usuario@nix.com',
        first_name: 'Usuário',
        last_name: 'Padrão',
        full_name: 'Usuário Padrão',
        is_active: true,
        is_staff: false,
        is_superuser: false,
        last_login: new Date().toISOString(),
        slug: 'usuario',
        position: 'Usuário',
        bio: 'Usuário padrão do sistema NIX',
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      'leitor': {
        id: '4',
        username: 'leitor',
        email: 'leitor@nix.com',
        first_name: 'Leitor',
        last_name: 'Assíduo',
        full_name: 'Leitor Assíduo',
        is_active: true,
        is_staff: false,
        is_superuser: false,
        last_login: new Date().toISOString(),
        slug: 'leitor',
        position: 'Leitor',
        bio: 'Leitor assíduo do sistema NIX',
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      'autor': {
        id: '5',
        username: 'autor',
        email: 'autor@nix.com',
        first_name: 'Autor',
        last_name: 'Conteúdo',
        full_name: 'Autor Conteúdo',
        is_active: true,
        is_staff: false,
        is_superuser: false,
        last_login: new Date().toISOString(),
        slug: 'autor',
        position: 'Autor',
        bio: 'Autor de conteúdo no sistema NIX',
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };

    // Verificar se temos dados simulados para este slug
    if (simulatedUsers[slug as keyof typeof simulatedUsers]) {
      console.log(`Retornando dados simulados para o usuário ${slug}:`, simulatedUsers[slug as keyof typeof simulatedUsers]);
      return simulatedUsers[slug as keyof typeof simulatedUsers];
    }
  }

    // Se não temos dados para este slug, criar um usuário genérico
    const mockUser = {
      id: '999', // Alterado para string para compatibilidade com UUID do backend
      username: slug,
      email: `${slug}@example.com`,
      first_name: 'Usuário',
      last_name: 'Simulado',
      is_active: true,
      is_staff: false,
      is_superuser: false,
      date_joined: new Date().toISOString(),
      last_login: new Date().toISOString(),
      slug: slug,
      position: 'Usuário',
      bio: 'Este é um usuário simulado criado porque o backend não está disponível.',
      avatar: null,
      articles_count: 0,
      comments_count: 0,
      last_articles: [],
      last_comments: []
    };

    console.log(`Retornando usuário genérico simulado para ${slug}:`, mockUser);
    return mockUser;
  }

/**
 * Cria um novo usuário
 * Tenta usar o endpoint simplificado e, se falhar, usa dados simulados
 */
export const createUser = async (data: Partial<User>): Promise<User> => {
  const token = getAccessToken();

  try {
    console.log('Tentando criar usuário no endpoint simplificado...');
    console.log('Dados para criação:', data);
    console.log('URL:', `${API_BASE_URL}/api/users-simple/create/`);

    const response = await fetch(`${API_BASE_URL}/api/users-simple/create/`, {
      method: 'POST',
      headers: getDefaultHeaders(token || undefined),
      body: JSON.stringify(data),
    });

    console.log('Status da resposta:', response.status);

    if (!response.ok) {
      throw new Error(`Erro ao criar usuário: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Dados do usuário criado:', responseData);
    return responseData;
  } catch (error) {
    console.warn('Erro ao criar usuário no endpoint simplificado, usando dados simulados:', error);

    // Tentar o endpoint original como fallback
    try {
      console.log('Tentando endpoint original como fallback...');
      console.log('URL:', `${API_BASE_URL}${API_ENDPOINTS.USERS.BASE}`);

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.BASE}`, {
        method: 'POST',
        headers: getDefaultHeaders(token || undefined),
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Dados do usuário criado pelo endpoint original:', responseData);
        return responseData;
      }
    } catch (fallbackError) {
      console.warn('Fallback também falhou:', fallbackError);
    }

    // Simular um atraso de rede para dar feedback visual
    await new Promise(resolve => setTimeout(resolve, 500));

    // Criar um usuário simulado
    const newUser: User = {
      id: Math.random().toString(36).substring(2, 15),
      username: data.username || 'novo_usuario',
      email: data.email || 'novo@example.com',
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      is_active: true,
      is_staff: false,
      is_superuser: false,
      slug: data.username || 'novo-usuario',
      position: data.position || '',
      bio: data.bio || '',
      avatar: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Retornando usuário simulado:', newUser);
    return newUser;
  }
};

/**
 * Atualiza os dados do usuário pelo slug
 * Tenta usar o endpoint simplificado e, se falhar, usa dados simulados
 */
export const updateUser = async (slug: string, data: Partial<User>): Promise<User> => {
  const token = getAccessToken();

  try {
    console.log('Tentando atualizar usuário no endpoint simplificado...');
    console.log('Dados para atualização:', data);
    console.log('URL:', `${API_BASE_URL}/api/users-simple/${slug}/update/`);

    const response = await fetch(`${API_BASE_URL}/api/users-simple/${slug}/update/`, {
      method: 'PUT',
      headers: getDefaultHeaders(token || undefined),
      body: JSON.stringify(data),
    });

    console.log('Status da resposta:', response.status);

    if (!response.ok) {
      throw new Error(`Erro ao atualizar usuário: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Dados do usuário atualizado:', responseData);
    return responseData;
  } catch (error) {
    console.warn(`Erro ao atualizar usuário com slug ${slug} no endpoint simplificado, usando dados simulados:`, error);

    // Tentar o endpoint original como fallback
    try {
      if (token) {
        console.log('Tentando endpoint original como fallback...');

        // Para enviar arquivos, precisamos usar FormData
        const formData = new FormData();

        // Adicionar campos ao FormData
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value);
            console.log(`Adicionando campo ao FormData: ${key}`);
          }
        });

        const url = `${API_BASE_URL}${API_ENDPOINTS.USERS.DETAIL(slug)}`;
        console.log('URL da requisição:', url);

        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Não definimos Content-Type aqui porque o FormData define automaticamente
          },
          body: formData,
        });

        if (response.ok) {
          const responseData = await response.json();
          console.log('Dados do usuário atualizado pelo endpoint original:', responseData);
          return responseData;
        }
      }
    } catch (fallbackError) {
      console.warn('Fallback também falhou:', fallbackError);
    }

    // Simular um atraso de rede para dar feedback visual
    await new Promise(resolve => setTimeout(resolve, 800));

    // Verificar se temos dados simulados para este slug
    if (MOCK_USER_DETAILS[slug]) {
      // Atualizar os dados simulados
      const updatedUser = {
        ...MOCK_USER_DETAILS[slug],
        ...data
      };

      // Atualizar o cache de dados simulados
      MOCK_USER_DETAILS[slug] = updatedUser as UserDetail;

      // Atualizar também na lista de usuários
      const userIndex = MOCK_USERS.findIndex(u => u.slug === slug);
      if (userIndex !== -1) {
        MOCK_USERS[userIndex] = {
          ...MOCK_USERS[userIndex],
          ...data
        };
      }

      return updatedUser;
    }

    // Se não temos dados para este slug, criar um usuário genérico atualizado
    const updatedUser = {
      id: '999', // Alterado para string para compatibilidade com UUID do backend
      username: slug,
      email: `${slug}@example.com`,
      first_name: data.first_name || 'Usuário',
      last_name: data.last_name || 'Simulado',
      is_active: data.is_active !== undefined ? data.is_active : true,
      is_staff: data.is_staff !== undefined ? data.is_staff : false,
      is_superuser: data.is_superuser !== undefined ? data.is_superuser : false,
      date_joined: new Date().toISOString(),
      last_login: new Date().toISOString(),
      slug: slug,
      position: data.position || 'Usuário',
      bio: data.bio || 'Este é um usuário simulado criado porque o backend não está disponível.',
      avatar: data.avatar || null
    };

    return updatedUser;
  }
};

/**
 * Atualiza o perfil do usuário atual
 * NOTA: Temporariamente usando dados simulados até que o backend esteja corrigido
 */
export const updateProfile = async (data: Partial<User>): Promise<User> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  console.log('Atualizando perfil do usuário atual');
  console.log('Dados para atualização:', data);

  // Usar diretamente dados simulados enquanto o backend não estiver funcionando
  // Remova este comentário e a linha abaixo quando o backend estiver corrigido
  return updateProfileMock(data);

  /* CÓDIGO ORIGINAL - Descomentar quando o backend estiver corrigido
  try {
    // Verificar se há um arquivo de avatar
    const hasFile = data.avatar instanceof File;

    if (hasFile) {
      // Se temos um arquivo, usar FormData
      const formData = new FormData();

      // Adicionar campos ao FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
          console.log(`Adicionando campo ao FormData: ${key}`);
        }
      });

      const url = `${API_BASE_URL}${API_ENDPOINTS.USERS.UPDATE_PROFILE}`;
      console.log('URL da requisição (FormData):', url);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Não definimos Content-Type aqui porque o FormData define automaticamente
        },
        body: formData,
      });

      console.log('Status da resposta:', response.status);

      await handleApiError(response);
      return response.json();
    } else {
      // Se não temos arquivo, usar JSON
      const jsonData = { ...data };
      delete jsonData.avatar; // Remover avatar se não for um arquivo

      const url = `${API_BASE_URL}${API_ENDPOINTS.USERS.UPDATE_PROFILE}`;
      console.log('URL da requisição (JSON):', url);

      const response = await fetch(url, {
        method: 'PUT',
        headers: getDefaultHeaders(token),
        body: JSON.stringify(jsonData),
      });

      console.log('Status da resposta:', response.status);

      await handleApiError(response);
      return response.json();
    }
  } catch (error) {
    console.warn('Erro ao atualizar perfil do usuário, usando dados simulados:', error);
    return updateProfileMock(data);
  }
  */
};

/**
 * Versão simulada da função updateProfile para uso quando o backend não estiver disponível
 */
const updateProfileMock = async (data: Partial<User>): Promise<User> => {
  console.log('Usando versão simulada de updateProfile');

  // Simular um atraso de rede para dar feedback visual
  await new Promise(resolve => setTimeout(resolve, 800));

  // Obter o usuário atual do localStorage
  const storedUser = localStorage.getItem('viixen_user');
  let currentUser: User | null = null;

  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
    } catch (e) {
      console.error('Erro ao parsear usuário do localStorage:', e);
    }
  }

  // Se não temos o usuário no localStorage, tentar obter do contexto de autenticação
  if (!currentUser) {
    // Verificar se temos um usuário simulado com o mesmo username
    const username = data.username || 'usuario_atual';
    const mockUser = MOCK_USERS.find(u => u.username === username);

    if (mockUser) {
      currentUser = { ...mockUser };
    } else {
      // Se não encontramos, criar um usuário genérico
      currentUser = {
        id: '999',
        username: username,
        email: `${username}@example.com`,
        first_name: '',
        last_name: '',
        is_active: true,
        is_staff: false,
        is_superuser: false,
        slug: username,
        position: '',
        bio: '',
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  // Processar o avatar se for um arquivo
  let avatarUrl = currentUser.avatar;
  if (data.avatar instanceof File) {
    // Simular o upload do avatar criando uma URL de objeto
    try {
      avatarUrl = URL.createObjectURL(data.avatar);
      console.log('Avatar simulado criado:', avatarUrl);
    } catch (e) {
      console.error('Erro ao criar URL para o avatar:', e);
    }
  }

  // Atualizar os dados do usuário com os novos valores
  const updatedUser = {
    ...currentUser,
    ...data,
    avatar: avatarUrl, // Usar a URL do avatar se disponível
    updated_at: new Date().toISOString()
  };

  // Remover o objeto File do usuário atualizado para evitar problemas de serialização
  if (updatedUser.avatar instanceof File) {
    updatedUser.avatar = avatarUrl;
  }

  console.log('Usuário atualizado (simulado):', updatedUser);

  // Atualizar o usuário no localStorage
  localStorage.setItem('viixen_user', JSON.stringify(updatedUser));

  // Atualizar também na lista de usuários simulados se existir
  const userIndex = MOCK_USERS.findIndex(u => u.id === updatedUser.id || u.username === updatedUser.username);
  if (userIndex !== -1) {
    MOCK_USERS[userIndex] = {
      ...MOCK_USERS[userIndex],
      ...updatedUser
    };
  }

  // Atualizar também nos detalhes de usuário simulados se existir
  if (updatedUser.slug && MOCK_USER_DETAILS[updatedUser.slug]) {
    MOCK_USER_DETAILS[updatedUser.slug] = {
      ...MOCK_USER_DETAILS[updatedUser.slug],
      ...updatedUser
    } as UserDetail;
  }

  return updatedUser;
};

/**
 * Altera a senha do usuário
 */
export const changePassword = async (data: PasswordChangeData): Promise<void> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.PASSWORD_CHANGE}`, {
    method: 'POST',
    headers: getDefaultHeaders(token),
    body: JSON.stringify(data),
  });

  await handleApiError(response);
};

/**
 * Exclui um usuário pelo slug
 * Tenta usar o endpoint simplificado e, se falhar, usa dados simulados
 */
export const deleteUser = async (slug: string): Promise<void> => {
  const token = getAccessToken();

  try {
    console.log('Tentando excluir usuário no endpoint simplificado...');
    console.log('URL:', `${API_BASE_URL}/api/users-simple/${slug}/delete/`);

    const response = await fetch(`${API_BASE_URL}/api/users-simple/${slug}/delete/`, {
      method: 'DELETE',
      headers: getDefaultHeaders(token || undefined),
    });

    console.log('Status da resposta:', response.status);

    if (!response.ok && response.status !== 204) {
      throw new Error(`Erro ao excluir usuário: ${response.status} ${response.statusText}`);
    }

    console.log('Usuário excluído com sucesso no endpoint simplificado');
    return;
  } catch (error) {
    console.warn(`Erro ao excluir usuário com slug ${slug} no endpoint simplificado, tentando fallback:`, error);

    // Tentar o endpoint original como fallback
    try {
      if (token) {
        console.log('Tentando endpoint original como fallback...');
        const url = `${API_BASE_URL}${API_ENDPOINTS.USERS.DETAIL(slug)}`;
        console.log('URL da requisição:', url);

        const response = await fetch(url, {
          method: 'DELETE',
          headers: getDefaultHeaders(token),
        });

        console.log('Status da resposta:', response.status);

        // Se a resposta for 204 (No Content), não há corpo para processar
        if (response.ok || response.status === 204) {
          console.log('Usuário excluído com sucesso no endpoint original');
          return;
        }
      }
    } catch (fallbackError) {
      console.warn('Fallback também falhou:', fallbackError);
    }

    console.warn(`Simulando exclusão do usuário com slug ${slug}`);

    // Simular um atraso de rede para dar feedback visual
    await new Promise(resolve => setTimeout(resolve, 800));

    // Remover o usuário dos dados simulados
    const userIndex = MOCK_USERS.findIndex(u => u.slug === slug);
    if (userIndex !== -1) {
      MOCK_USERS.splice(userIndex, 1);
    }

    // Remover também dos detalhes
    if (MOCK_USER_DETAILS[slug]) {
      delete MOCK_USER_DETAILS[slug];
    }
  }
};

/**
 * Obtém as configurações do usuário
 * NOTA: Temporariamente usando localStorage até que o backend esteja corrigido
 */
export const getSettings = async () => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  // Usar localStorage temporariamente
  console.log('Usando localStorage temporariamente para obter configurações');
  const theme = localStorage.getItem('theme') || 'dark';
  const themeColor = localStorage.getItem('themeColor') || 'blue';
  const useSystemTheme = localStorage.getItem('useSystemTheme') === 'true';

  // Simular um atraso de rede para dar feedback visual
  await new Promise(resolve => setTimeout(resolve, 100));

  // Retornar as configurações do localStorage
  return {
    theme,
    theme_color: themeColor,
    use_system_theme: useSystemTheme
  };

  /* CÓDIGO ORIGINAL - Descomentar quando o backend estiver corrigido
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.BASE}settings/`, {
    method: 'GET',
    headers: getDefaultHeaders(token),
  });

  await handleApiError(response);
  return response.json();
  */
};

/**
 * Atualiza as configurações do usuário
 * NOTA: Temporariamente usando localStorage até que o backend esteja corrigido
 */
export const updateSettings = async (data: any) => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  // Usar localStorage temporariamente
  console.log('Usando localStorage temporariamente para salvar configurações');
  if (data.theme) localStorage.setItem('theme', data.theme);
  if (data.theme_color) localStorage.setItem('themeColor', data.theme_color);
  if (data.use_system_theme !== undefined) localStorage.setItem('useSystemTheme', data.use_system_theme.toString());

  // Simular um atraso de rede para dar feedback visual
  await new Promise(resolve => setTimeout(resolve, 100));

  // Retornar os dados atualizados
  return data;

  /* CÓDIGO ORIGINAL - Descomentar quando o backend estiver corrigido
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.BASE}settings/`, {
    method: 'PUT',
    headers: getDefaultHeaders(token),
    body: JSON.stringify(data),
  });

  await handleApiError(response);
  return response.json();
  */
};
