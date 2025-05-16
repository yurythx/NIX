'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import booksService from '../../../services/api/books.service';
import { useNotification } from '../../../contexts/NotificationContext';

interface DeleteBookButtonProps {
  slug: string;
  className?: string;
  buttonText?: string;
  showIcon?: boolean;
  onDelete?: () => void;
}

export default function DeleteBookButton({
  slug,
  className = 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors',
  buttonText = 'Excluir',
  showIcon = true,
  onDelete
}: DeleteBookButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { showNotification } = useNotification();

  const handleDelete = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      await booksService.deleteBook(slug);
      showNotification('success', 'Livro excluído com sucesso!');

      // Chamar a função de callback se fornecida
      if (onDelete) {
        onDelete();
      }

      setShowConfirm(false);
    } catch (error: any) {
      console.error('Erro ao excluir livro:', error);
      showNotification('error', error.message || 'Erro ao excluir livro. Tente novamente mais tarde.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          {isDeleting ? 'Excluindo...' : 'Confirmar'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setShowConfirm(true);
      }}
      className={className}
    >
      {showIcon && <Trash2 className="w-4 h-4" />}
      {buttonText}
    </button>
  );
}
