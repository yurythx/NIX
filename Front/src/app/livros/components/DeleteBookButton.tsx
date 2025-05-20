'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import booksService from '../../../services/api/books.service';
import { useNotification } from '../../../contexts/NotificationContext';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { useRouter } from 'next/navigation';

interface DeleteBookButtonProps {
  slug: string;
  className?: string;
  buttonText?: string;
  showIcon?: boolean;
  onDelete?: () => void;
}

export default function DeleteBookButton({
  slug,
  className = 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors',
  buttonText = 'Excluir',
  showIcon = true,
  onDelete
}: DeleteBookButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const router = useRouter();

  const handleDelete = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      setError(null);
      await booksService.deleteBook(slug);
      showNotification('success', 'Livro excluído com sucesso!');

      // Fechar o modal antes de redirecionar
      setShowConfirm(false);

      // Aumentar o atraso antes de redirecionar para garantir que a animação do modal termine
      setTimeout(() => {
        // Chamar a função de callback se fornecida
        if (onDelete) {
          onDelete();
        } else {
          // Redirecionar para a página de listagem
          console.log('Redirecionando para /livros após exclusão');

          // Usar apenas router.push para evitar o piscar da tela
          router.push('/livros');
        }
      }, 500);
    } catch (error: any) {
      console.error('Erro ao excluir livro:', error);
      setError(error.message || 'Erro ao excluir livro. Tente novamente mais tarde.');
      showNotification('error', error.message || 'Erro ao excluir livro. Tente novamente mais tarde.');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowConfirm(true);
        }}
        className={className}
        title="Excluir livro"
      >
        {showIcon && <Trash2 className="w-4 h-4" />}
        {buttonText}
      </button>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Confirmar exclusão"
        message="Tem certeza que deseja excluir este livro? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        isLoading={isDeleting}
        error={error}
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />
    </>
  );
}
