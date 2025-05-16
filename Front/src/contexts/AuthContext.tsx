'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, LoginData, UserCreateData } from '../types/models';
import * as authService from '../services/api/auth.service';

// Interface do contexto de autenticação
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  logout: () => void;
  register: (data: UserCreateData) => Promise<void>;
  refreshUser: () => Promise<void>;
  lastRefresh: Date | null;
}

// Criação do contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Provedor do contexto
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Referência para o intervalo de atualização
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Tempo de atualização em milissegundos (15 minutos)
  const REFRESH_INTERVAL = 15 * 60 * 1000;

  // Função para verificar autenticação
  const checkAuth = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticated(isAuth);

      if (isAuth) {
        // Se forceRefresh for true ou não houver usuário armazenado, buscar da API
        if (forceRefresh || !authService.getStoredUser()) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          // Armazenar no localStorage
          localStorage.setItem('prometheus_user', JSON.stringify(currentUser));
          setLastRefresh(new Date());
        } else {
          // Usar usuário do armazenamento local
          const storedUser = authService.getStoredUser();
          setUser(storedUser);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verificar autenticação ao carregar
  useEffect(() => {
    checkAuth();

    // Configurar intervalo de atualização
    refreshIntervalRef.current = setInterval(() => {
      if (isAuthenticated) {
        checkAuth(true); // Forçar atualização dos dados do usuário
      }
    }, REFRESH_INTERVAL);

    // Limpar intervalo ao desmontar
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [checkAuth, isAuthenticated]);

  // Função de login
  const login = async (data: LoginData) => {
    try {
      setIsLoading(true);
      const response = await authService.login(data);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);

    // Limpar preferências de tema da sessão
    // Mantém as preferências no localStorage para usuários não autenticados
    sessionStorage.removeItem('theme');
    sessionStorage.removeItem('themeColor');
    sessionStorage.removeItem('useSystemTheme');

    // Recarregar as preferências do localStorage
    const savedTheme = localStorage.getItem('theme');
    const savedColor = localStorage.getItem('themeColor');
    const savedUseSystemTheme = localStorage.getItem('useSystemTheme');

    // Aplicar tema do localStorage ou padrão
    if (savedTheme) {
      document.documentElement.classList.remove('light', 'dark', 'sepia');
      document.documentElement.classList.add(savedTheme);
    }

    // Aplicar cor do tema do localStorage ou padrão
    if (savedColor) {
      document.documentElement.classList.remove('theme-blue', 'theme-purple', 'theme-green', 'theme-red', 'theme-orange');
      document.documentElement.classList.add(`theme-${savedColor}`);
    }
  };

  // Função de registro
  const register = async (data: UserCreateData) => {
    try {
      setIsLoading(true);
      console.log('Iniciando registro de usuário:', { ...data, password: '***', password_confirm: '***' });

      const registeredUser = await authService.register(data);
      console.log('Usuário registrado com sucesso:', registeredUser);

      if (registeredUser) {
        // Após o registro bem-sucedido, fazer login automaticamente
        console.log('Tentando login automático após registro');
        try {
          await login({ email: data.email, password: data.password });
          console.log('Login automático realizado com sucesso');
        } catch (loginError) {
          console.error('Erro no login automático após registro:', loginError);
          // Mesmo que o login falhe, o registro foi bem-sucedido
          // Então não propagamos esse erro
        }
      }

      return registeredUser;
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar os dados do usuário
  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      // Atualizar no localStorage
      localStorage.setItem('prometheus_user', JSON.stringify(currentUser));
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    refreshUser,
    lastRefresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
