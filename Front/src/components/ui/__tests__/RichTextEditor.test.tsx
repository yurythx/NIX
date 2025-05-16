import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RichTextEditor from '../RichTextEditor';
import '@testing-library/jest-dom';

describe('RichTextEditor', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the editor component', () => {
    render(<RichTextEditor value="Test content" onChange={mockOnChange} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('passes the initial value to the editor', () => {
    render(<RichTextEditor value="Test content" onChange={mockOnChange} />);
    expect(screen.getByRole('textbox')).toHaveValue('Test content');
  });

  it('calls onChange when text is entered', () => {
    render(<RichTextEditor value="Test content" onChange={mockOnChange} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New content' } });
    expect(mockOnChange).toHaveBeenCalledWith('New content');
  });

  it('renders formatting buttons', () => {
    render(<RichTextEditor value="Test content" onChange={mockOnChange} />);
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('I')).toBeInTheDocument();
    expect(screen.getByText('H2')).toBeInTheDocument();
    expect(screen.getByText('P')).toBeInTheDocument();
    expect(screen.getByText('Link')).toBeInTheDocument();
  });

  it('renders HTML preview', () => {
    render(<RichTextEditor value="<p>Test content</p>" onChange={mockOnChange} />);
    expect(screen.getByText('Visualização HTML:')).toBeInTheDocument();
  });

  it('applies formatting when buttons are clicked', () => {
    render(<RichTextEditor value="Test content" onChange={mockOnChange} />);

    // Mock selection in textarea
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    Object.defineProperty(textarea, 'selectionStart', { value: 0 });
    Object.defineProperty(textarea, 'selectionEnd', { value: 12 });

    // Click bold button
    fireEvent.click(screen.getByText('B'));
    expect(mockOnChange).toHaveBeenCalledWith('<strong>Test content</strong>');
  });
});
