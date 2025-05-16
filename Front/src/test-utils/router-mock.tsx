/**
 * Mock para o Next.js Router
 * 
 * Este arquivo fornece mocks para os hooks de roteamento do Next.js,
 * permitindo testar componentes que dependem desses hooks.
 */

import React, { ReactNode } from 'react';

// Mock para o useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/mock-path',
    query: {},
  }),
  usePathname: () => '/mock-path',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock para o useRouter do next/router (versão antiga)
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/mock-route',
    pathname: '/mock-path',
    query: {},
    asPath: '/mock-path',
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
  }),
}));

// Wrapper de teste que fornece o contexto do router
interface RouterProviderProps {
  children: ReactNode;
}

export const RouterProvider: React.FC<RouterProviderProps> = ({ children }) => {
  return <>{children}</>;
};

// Função de utilidade para envolver componentes com o RouterProvider
export function withRouter(component: ReactNode): ReactNode {
  return <RouterProvider>{component}</RouterProvider>;
}
