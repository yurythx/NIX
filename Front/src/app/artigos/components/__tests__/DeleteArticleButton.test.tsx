import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeleteArticleButton from '../DeleteArticleButton';
import * as articlesService from '../../../../services/api/articles.service';
import { NotificationProvider } from '../../../../contexts/NotificationContext';

// Mock do serviço de artigos
jest.mock('../../../../services/api/articles.service', () => ({
  deleteArticle: jest.fn(),
}));

// Mock do useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock do localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('DeleteArticleButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('viixen_access_token', 'fake-token');
  });

  it('renders the button with default text', () => {
    render(
      <NotificationProvider>
        <DeleteArticleButton slug="test-article" />
      </NotificationProvider>
    );
    
    const button = screen.getByRole('button', { name: /excluir artigo/i });
    expect(button).toBeInTheDocument();
  });

  it('renders the button with custom text', () => {
    render(
      <NotificationProvider>
        <DeleteArticleButton slug="test-article" buttonText="Remover" />
      </NotificationProvider>
    );
    
    const button = screen.getByText('Remover');
    expect(button).toBeInTheDocument();
  });

  it('shows confirmation dialog when clicked', () => {
    render(
      <NotificationProvider>
        <DeleteArticleButton slug="test-article" />
      </NotificationProvider>
    );
    
    const button = screen.getByRole('button', { name: /excluir artigo/i });
    fireEvent.click(button);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Confirmar exclusão')).toBeInTheDocument();
  });

  it('calls deleteArticle when confirmed', async () => {
    // Mock da função deleteArticle para retornar uma Promise resolvida
    (articlesService.deleteArticle as jest.Mock).mockResolvedValue({});
    
    render(
      <NotificationProvider>
        <DeleteArticleButton slug="test-article" />
      </NotificationProvider>
    );
    
    // Clicar no botão para abrir o diálogo
    const button = screen.getByRole('button', { name: /excluir artigo/i });
    fireEvent.click(button);
    
    // Clicar no botão de confirmação
    const confirmButton = screen.getByText('Excluir');
    fireEvent.click(confirmButton);
    
    // Verificar se a função deleteArticle foi chamada com o slug correto
    await waitFor(() => {
      expect(articlesService.deleteArticle).toHaveBeenCalledWith('test-article');
    });
  });

  it('calls onDelete callback when provided', async () => {
    // Mock da função deleteArticle para retornar uma Promise resolvida
    (articlesService.deleteArticle as jest.Mock).mockResolvedValue({});
    
    // Mock da função onDelete
    const onDelete = jest.fn();
    
    render(
      <NotificationProvider>
        <DeleteArticleButton slug="test-article" onDelete={onDelete} />
      </NotificationProvider>
    );
    
    // Clicar no botão para abrir o diálogo
    const button = screen.getByRole('button', { name: /excluir artigo/i });
    fireEvent.click(button);
    
    // Clicar no botão de confirmação
    const confirmButton = screen.getByText('Excluir');
    fireEvent.click(confirmButton);
    
    // Verificar se a função onDelete foi chamada
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalled();
    });
  });
});
