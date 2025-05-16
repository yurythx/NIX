import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import BookDetailPage from '../page';
import * as booksService from '../../../../services/api/books.service';
import { useAuth } from '../../../../contexts/AuthContext';
import { useNotification } from '../../../../contexts/NotificationContext';
import { AllProviders } from '../../../../test-utils/test-wrapper';

// Import router mock to ensure it's loaded
import '../../../../test-utils/router-mock';

// Mock the services
jest.mock('../../../../services/api/books.service');

// Mock the contexts
jest.mock('../../../../contexts/AuthContext');
jest.mock('../../../../contexts/NotificationContext');

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}));

// Mock Audio
global.Audio = jest.fn().mockImplementation(() => ({
  pause: jest.fn(),
  play: jest.fn(),
}));

// Função customizada de renderização com todos os providers
const customRender = (ui: React.ReactElement) => {
  return render(ui, { wrapper: AllProviders });
};

describe('BookDetailPage', () => {
  const mockBook = {
    id: 1,
    title: 'Test Book',
    slug: 'test-book',
    description: 'This is a test book description',
    cover: null,
    has_audio: true,
    audio_file: 'https://example.com/audio.mp3',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    category: 1,
    category_name: 'Fiction',
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock useParams to return a slug
    (useParams as jest.Mock).mockReturnValue({ slug: 'test-book' });

    // Mock the context hooks
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    (useNotification as jest.Mock).mockReturnValue({
      showNotification: jest.fn(),
    });

    // Mock the service function
    (booksService.getBookBySlug as jest.Mock).mockResolvedValue(mockBook);
  });

  it('should render the book detail page with loading state initially', async () => {
    customRender(<BookDetailPage />);

    // Check if loading state is shown
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  it('should render book details after loading', async () => {
    customRender(<BookDetailPage />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Check if book details are rendered
    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('This is a test book description')).toBeInTheDocument();
    expect(screen.getByText('Fiction')).toBeInTheDocument();
  });

  it('should show audio player for books with audio', async () => {
    customRender(<BookDetailPage />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Check if audio player is shown
    expect(screen.getByText('Áudio do Livro')).toBeInTheDocument();
    expect(screen.getByText('Reproduzir Áudio')).toBeInTheDocument();
  });

  it('should toggle audio playback when play button is clicked', async () => {
    customRender(<BookDetailPage />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Find and click the play button
    const playButton = screen.getByText('Reproduzir Áudio');
    fireEvent.click(playButton);

    // Check if the button text changes
    expect(screen.getByText('Pausar Áudio')).toBeInTheDocument();

    // Click again to pause
    fireEvent.click(screen.getByText('Pausar Áudio'));

    // Check if the button text changes back
    expect(screen.getByText('Reproduzir Áudio')).toBeInTheDocument();
  });

  it('should show edit and delete buttons for admin users', async () => {
    // Mock admin user
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'admin', is_staff: true },
    });

    customRender(<BookDetailPage />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Check if edit and delete buttons are shown
    expect(screen.getByText('Editar')).toBeInTheDocument();
    expect(screen.getByText('Excluir')).toBeInTheDocument();
  });

  it('should not show edit and delete buttons for regular users', async () => {
    customRender(<BookDetailPage />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Check if edit and delete buttons are not shown
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
    expect(screen.queryByText('Excluir')).not.toBeInTheDocument();
  });

  it('should handle errors when loading book', async () => {
    // Mock error in service
    (booksService.getBookBySlug as jest.Mock).mockRejectedValue(new Error('Failed to load book'));

    customRender(<BookDetailPage />);

    // Wait for the error to be handled
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Check if error message is shown
    expect(screen.getByText(/Não foi possível carregar o livro/i)).toBeInTheDocument();
  });

  it('should show "Livro não encontrado" when book is null', async () => {
    // Mock null book
    (booksService.getBookBySlug as jest.Mock).mockResolvedValue(null);

    customRender(<BookDetailPage />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Check if "not found" message is shown
    expect(screen.getByText('Livro não encontrado')).toBeInTheDocument();
  });
});
