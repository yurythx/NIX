import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Loading from '../Loading';

describe('Loading', () => {
  it('renders with default props', () => {
    render(<Loading />);
    
    // Verificar se o componente de loading foi renderizado
    const loadingElement = screen.getByTestId('loading-spinner');
    expect(loadingElement).toBeInTheDocument();
    
    // Verificar se o texto padrão está presente
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<Loading text="Processando dados" />);
    
    // Verificar se o texto personalizado está presente
    expect(screen.getByText('Processando dados')).toBeInTheDocument();
  });

  it('renders with custom size', () => {
    render(<Loading size="lg" />);
    
    // Verificar se a classe de tamanho foi aplicada
    const loadingElement = screen.getByTestId('loading-spinner');
    expect(loadingElement).toHaveClass('w-12');
    expect(loadingElement).toHaveClass('h-12');
  });

  it('renders with custom color', () => {
    render(<Loading color="red" />);
    
    // Verificar se a classe de cor foi aplicada
    const loadingElement = screen.getByTestId('loading-spinner');
    expect(loadingElement).toHaveClass('text-red-500');
  });

  it('renders with fullscreen mode', () => {
    render(<Loading fullscreen />);
    
    // Verificar se o modo fullscreen foi aplicado
    const container = screen.getByTestId('loading-container');
    expect(container).toHaveClass('fixed');
    expect(container).toHaveClass('inset-0');
  });

  it('renders with custom className', () => {
    render(<Loading className="custom-loading" />);
    
    // Verificar se a classe personalizada foi aplicada
    const container = screen.getByTestId('loading-container');
    expect(container).toHaveClass('custom-loading');
  });

  it('renders without text when hideText is true', () => {
    render(<Loading hideText />);
    
    // Verificar se o texto não está presente
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
  });
});
