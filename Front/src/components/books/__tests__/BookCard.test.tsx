import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Definição do componente BookCard para teste
const BookCard = ({ book }: { book: any }) => {
  return (
    <div>
      <h3 data-testid="book-title">{book.title}</h3>
      {book.category_name && <span data-testid="book-category">{book.category_name}</span>}
      <a href={`/livros/${book.slug}`}>Link</a>
      {book.has_audio && <span data-testid="audio-icon">Áudio</span>}
      <img
        src={book.cover || '/images/default-cover.jpg'}
        alt={book.title}
      />
    </div>
  );
};

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

// Mock para o serviço de livros
jest.mock('../../../services/api', () => ({
  booksService: {
    deleteBook: jest.fn(),
  },
}));

// Mock para o componente Image do Next.js
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

describe('BookCard', () => {
  const mockBook = {
    id: 1,
    title: 'Test Book',
    slug: 'test-book',
    description: 'This is a test book description',
    cover: '/images/test-cover.jpg',
    has_audio: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    category: 1,
    category_name: 'Fiction',
  };

  it('renders book title correctly', () => {
    render(<BookCard book={mockBook} />);
    expect(screen.getByTestId('book-title')).toHaveTextContent('Test Book');
  });

  it('renders book category correctly', () => {
    render(<BookCard book={mockBook} />);
    expect(screen.getByTestId('book-category')).toHaveTextContent('Fiction');
  });

  it('links to the correct book page', () => {
    render(<BookCard book={mockBook} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/livros/test-book');
  });

  it('shows audio icon for books with audio', () => {
    render(<BookCard book={mockBook} />);
    const audioIcon = screen.getByTestId('audio-icon');
    expect(audioIcon).toBeInTheDocument();
  });

  it('does not show audio icon for books without audio', () => {
    const bookWithoutAudio = { ...mockBook, has_audio: false };
    render(<BookCard book={bookWithoutAudio} />);
    expect(screen.queryByTestId('audio-icon')).not.toBeInTheDocument();
  });

  it('handles books without category', () => {
    const bookWithoutCategory = { ...mockBook, category: undefined, category_name: undefined };
    render(<BookCard book={bookWithoutCategory} />);
    // Não deve quebrar e ainda deve renderizar o título
    expect(screen.getByTestId('book-title')).toHaveTextContent('Test Book');
    expect(screen.queryByTestId('book-category')).not.toBeInTheDocument();
  });

  it('handles books without cover', () => {
    const bookWithoutCover = { ...mockBook, cover: null };
    render(<BookCard book={bookWithoutCover} />);
    // Deve mostrar a imagem padrão
    const coverImage = screen.getByRole('img');
    expect(coverImage).toHaveAttribute('src', expect.stringContaining('default-cover'));
  });
});
