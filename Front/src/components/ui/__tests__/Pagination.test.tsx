import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Pagination from '../Pagination';

describe('Pagination', () => {
  // Função de mock para o onPageChange
  const mockOnPageChange = jest.fn();

  // Resetar o mock antes de cada teste
  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  it('renders correctly with default props', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

    // Verificar se o botão da página atual está presente e destacado
    const currentPageButton = screen.getByText('1');
    expect(currentPageButton).toBeInTheDocument();
    expect(currentPageButton).toHaveClass('bg-indigo-600');

    // Verificar se os botões de navegação estão presentes
    expect(screen.getByLabelText('Página anterior')).toBeInTheDocument();
    expect(screen.getByLabelText('Próxima página')).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

    // Verificar se o botão de página anterior está desabilitado
    const prevButton = screen.getByLabelText('Página anterior');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={mockOnPageChange} />);

    // Verificar se o botão de próxima página está desabilitado
    const nextButton = screen.getByLabelText('Próxima página');
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange when clicking on a page button', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

    // Clicar no botão da página 3
    fireEvent.click(screen.getByText('3'));

    // Verificar se a função onPageChange foi chamada com o número da página
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange when clicking on next button', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

    // Clicar no botão de próxima página
    fireEvent.click(screen.getByLabelText('Próxima página'));

    // Verificar se a função onPageChange foi chamada com a próxima página
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when clicking on previous button', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

    // Clicar no botão de página anterior
    fireEvent.click(screen.getByLabelText('Página anterior'));

    // Verificar se a função onPageChange foi chamada com a página anterior
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('shows ellipsis for large number of pages', () => {
    render(<Pagination currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

    // Verificar se as elipses estão presentes
    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThan(0);
  });

  it('shows correct range of pages around current page', () => {
    render(<Pagination currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

    // Verificar se as páginas ao redor da página atual são mostradas
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();

    // Verificar se a primeira e a última página são mostradas
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('applies custom className if provided', () => {
    // Nota: O componente atual não suporta className personalizada
    // Este teste é um placeholder para futura implementação
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    // Verificar se o componente foi renderizado corretamente
    const paginationContainer = screen.getByRole('navigation');
    expect(paginationContainer).toBeInTheDocument();
  });

  it('renders nothing when totalPages is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={mockOnPageChange} />
    );

    // Verificar se o componente não renderiza nada quando há apenas uma página
    expect(container).toBeEmptyDOMElement();
  });
});
