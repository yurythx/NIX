'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import * as articlesService from '../../../services/api/articles.service';
import { useNotification } from '../../../contexts/NotificationContext';
import ConfirmationModal from '../../../components/common/ConfirmationModal';

interface DeleteArticleButtonProps {
  slug: string;
  className?: string;
  buttonText?: string;
  onDelete?: () => void;
  showIcon?: boolean;
}

export default function DeleteArticleButton({
  slug,
  className = '',
  buttonText,
  onDelete,
  showIcon = true
}: DeleteArticleButtonProps) {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Usar useCallback para evitar recriações desnecessárias da função
  const handleDelete = useCallback(async () => {
    if (isDeleting || isRedirecting) return;

    try {
      setIsDeleting(true);
      setError(null);

      console.log('Tentando excluir artigo com slug:', slug);

      // Verificar se temos um token de acesso
      const token = localStorage.getItem('viixen_access_token');
      console.log('Token de acesso disponível:', !!token);

      await articlesService.deleteArticle(slug);

      // Mostrar notificação de sucesso
      showNotification('success', `Artigo "${slug}" excluído com sucesso!`);

      // Fechar o modal
      setShowConfirmation(false);

      // Marcar que estamos redirecionando para evitar múltiplas chamadas
      setIsRedirecting(true);

      // Aumentar o atraso antes de redirecionar para garantir que a animação do modal termine
      setTimeout(() => {
        // Executar callback ou redirecionar
        if (onDelete) {
          onDelete();
        } else {
          // Redirecionar para a lista de artigos após excluir
          console.log('Redirecionando para /artigos após exclusão');

          // Usar apenas router.push para evitar o piscar da tela
          router.push('/artigos');
        }
      }, 500);
    } catch (err: any) {
      console.error('Erro ao excluir artigo:', err);
      const errorMessage = err.message || 'Ocorreu um erro ao excluir o artigo. Por favor, tente novamente.';
      setError(errorMessage);
      showNotification('error', errorMessage);
      setIsDeleting(false);
    }
  }, [slug, isDeleting, isRedirecting, onDelete, router, showNotification]);

  // Manipulador para abrir o modal
  const handleOpenModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirmation(true);
  }, []);

  // Manipulador para fechar o modal
  const handleCloseModal = useCallback(() => {
    if (!isDeleting) {
      setShowConfirmation(false);
    }
  }, [isDeleting]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className={`${className || 'text-red-600 hover:text-red-800 focus:outline-none'}`}
        title="Excluir artigo"
        aria-label="Excluir artigo"
        aria-haspopup="dialog"
        disabled={isDeleting || isRedirecting}
      >
        {showIcon && <Trash2 className="w-5 h-5 inline mr-1" aria-hidden="true" />}
        {buttonText}
      </button>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={handleCloseModal}
        onConfirm={handleDelete}
        title="Confirmar exclusão"
        message="Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        isLoading={isDeleting}
        error={error}
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />
    </>
  );
}
