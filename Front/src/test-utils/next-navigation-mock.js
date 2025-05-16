/**
 * Mock para o Next.js Navigation
 * 
 * Este arquivo fornece mocks para os hooks de navegação do Next.js,
 * permitindo testar componentes que dependem desses hooks.
 */

// Mock para o useRouter
const useRouter = jest.fn().mockImplementation(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/mock-path',
  query: {},
}));

// Mock para o usePathname
const usePathname = jest.fn().mockImplementation(() => '/mock-path');

// Mock para o useSearchParams
const useSearchParams = jest.fn().mockImplementation(() => new URLSearchParams());

// Mock para o useParams
const useParams = jest.fn().mockImplementation(() => ({}));

// Mock para o redirect
const redirect = jest.fn();

// Mock para o notFound
const notFound = jest.fn();

module.exports = {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
  redirect,
  notFound,
};
