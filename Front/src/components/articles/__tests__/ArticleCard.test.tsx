import React from 'react';
import { render, screen } from '@testing-library/react';
import ArticleCard from '../ArticleCard';
import '@testing-library/jest-dom';

// Mock para o next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock para o next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock para o contexto de autenticação
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
  }),
}));

// Mock para o contexto de notificação
jest.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: jest.fn(),
  }),
}));

// Mock para o serviço de artigos
jest.mock('../../../services/api', () => ({
  articlesService: {
    deleteArticle: jest.fn(),
  },
}));

describe('ArticleCard', () => {
  const mockArticle = {
    id: 1,
    title: 'Test Article',
    slug: 'test-article',
    content: '<p>This is a test article content</p>',
    created_at: '2023-01-01T00:00:00Z',
    comments_count: 5,
    category: {
      id: 1,
      name: 'Test Category',
      slug: 'test-category'
    }
  };

  it('renders article title correctly', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('Test Article')).toBeInTheDocument();
  });

  it('renders article excerpt correctly', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('This is a test article content')).toBeInTheDocument();
  });

  it('renders article category correctly', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('Test Category')).toBeInTheDocument();
  });

  it('renders article comments count correctly', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('links to the correct article page', () => {
    render(<ArticleCard article={mockArticle} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/artigos/test-article');
  });

  it('formats the date correctly', () => {
    render(<ArticleCard article={mockArticle} />);
    // Verificar se a data formatada está presente
    // O formato exato pode variar dependendo da localização
    expect(screen.getByText(/31 de dezembro de 2022/i)).toBeInTheDocument();
  });

  it('handles articles without category', () => {
    const articleWithoutCategory = { ...mockArticle, category: undefined };
    render(<ArticleCard article={articleWithoutCategory} />);
    // Não deve quebrar e ainda deve renderizar o título
    expect(screen.getByText('Test Article')).toBeInTheDocument();
  });

  it('handles articles without comments count', () => {
    const articleWithoutComments = { ...mockArticle, comments_count: undefined };
    render(<ArticleCard article={articleWithoutComments} />);
    // Deve mostrar 0 como valor padrão
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
