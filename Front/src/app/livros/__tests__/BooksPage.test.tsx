import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LivrosPage from '../page';
import * as booksService from '../../../services/api/books.service';
import * as categoriesService from '../../../services/api/categories.service';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { AllProviders } from '../../../test-utils/test-wrapper';

// Import router mock to ensure it's loaded
import '../../../test-utils/router-mock';

// Mock the services
jest.mock('../../../services/api/books.service');
jest.mock('../../../services/api/categories.service');

// Mock the contexts
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../contexts/NotificationContext');
jest.mock('../../../contexts/ThemeContext');

// Mock framer-motion to avoid issues with animations in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
}));

// Função customizada de renderização com todos os providers
const customRender = (ui: React.ReactElement) => {
  return render(ui, { wrapper: AllProviders });
};

describe('LivrosPage', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock the context hooks
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    (useNotification as jest.Mock).mockReturnValue({
      showNotification: jest.fn(),
    });

    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      themeColor: 'indigo',
    });

    // Mock the service functions
    (booksService.getPaginatedBooks as jest.Mock).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          title: 'Test Book 1',
          slug: 'test-book-1',
          description: 'Description 1',
          cover: null,
          has_audio: true,
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
          category: 1,
          category_name: 'Fiction',
        },
        {
          id: 2,
          title: 'Test Book 2',
          slug: 'test-book-2',
          description: 'Description 2',
          cover: null,
          has_audio: false,
          created_at: '2023-01-02',
          updated_at: '2023-01-02',
          category: 2,
          category_name: 'Non-Fiction',
        },
      ],
    });

    (categoriesService.getCategories as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Fiction', slug: 'fiction' },
      { id: 2, name: 'Non-Fiction', slug: 'non-fiction' },
    ]);
  });

  it('should render the books page with loading state initially', async () => {
    customRender(<LivrosPage />);

    // Check if loading state is shown
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  it('should render books after loading', async () => {
    customRender(<LivrosPage />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Check if books are rendered
    expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    expect(screen.getByText('Test Book 2')).toBeInTheDocument();
  });

  it('should filter books when search is used', async () => {
    customRender(<LivrosPage />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Find the search input and type in it
    const searchInput = screen.getByPlaceholderText('Buscar livros...');
    fireEvent.change(searchInput, { target: { value: 'Test Book 1' } });

    // The service should be called with the search term
    expect(booksService.getPaginatedBooks).toHaveBeenCalledWith(
      expect.anything(),
      'Test Book 1',
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
  });

  it('should show "Novo Livro" button when authenticated', async () => {
    // Mock authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'testuser' },
    });

    customRender(<LivrosPage />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Check if the "Novo Livro" button is shown
    expect(screen.getByText('Novo Livro')).toBeInTheDocument();
  });

  it('should not show "Novo Livro" button when not authenticated', async () => {
    customRender(<LivrosPage />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Check if the "Novo Livro" button is not shown
    expect(screen.queryByText('Novo Livro')).not.toBeInTheDocument();
  });

  it('should show edit and delete buttons for admin users', async () => {
    // Mock admin user
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'admin', is_staff: true },
    });

    customRender(<LivrosPage />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Check if edit buttons are shown (there should be multiple)
    const editButtons = screen.getAllByTitle('Editar');
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('should handle errors when loading books', async () => {
    // Mock error in service
    (booksService.getPaginatedBooks as jest.Mock).mockRejectedValue(new Error('Failed to load books'));

    customRender(<LivrosPage />);

    // Wait for the error to be handled
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Check if error message is shown
    expect(screen.getByText(/Não foi possível carregar os livros/i)).toBeInTheDocument();
  });
});
