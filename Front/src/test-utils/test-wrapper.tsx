/**
 * Wrapper de teste para fornecer todos os contextos necessários
 * 
 * Este arquivo fornece um wrapper que inclui todos os providers necessários
 * para testar componentes que dependem de contextos como autenticação,
 * notificações, etc.
 */

import React, { ReactNode } from 'react';
import { RouterProvider } from './router-mock';

// Mock para o contexto de autenticação
export const mockAuthContext = {
  isAuthenticated: false,
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  loading: false,
  error: null,
};

// Mock para o contexto de notificação
export const mockNotificationContext = {
  notifications: [],
  showNotification: jest.fn(),
  hideNotification: jest.fn(),
  clearNotifications: jest.fn(),
};

// Mock para o contexto de autenticação
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock para o contexto de notificação
jest.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotificationContext,
}));

// Wrapper de teste que fornece todos os contextos
interface AllProvidersProps {
  children: ReactNode;
}

export const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  return (
    <RouterProvider>
      {children}
    </RouterProvider>
  );
};

// Função de utilidade para envolver componentes com todos os providers
export function withAllProviders(component: ReactNode): ReactNode {
  return <AllProviders>{component}</AllProviders>;
}
