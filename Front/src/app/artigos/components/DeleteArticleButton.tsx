'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import * as articlesService from '../../../services/api/articles.service';
import { useNotification } from '../../../contexts/NotificationContext';

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

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      console.log('Tentando excluir artigo com slug:', slug);

      // Verificar se temos um token de acesso
      const token = localStorage.getItem('viixen_access_token');
      console.log('Token de acesso disponível:', !!token);

      await articlesService.deleteArticle(slug);

      // Mostrar notificação de sucesso com mais detalhes
      showNotification('success', `Artigo "${slug}" excluído com sucesso! Redirecionando para a lista de artigos...`);

      // Executar callback ou redirecionar
      if (onDelete) {
        onDelete();
      } else {
        // Redirecionar para a lista de artigos após excluir
        router.push('/artigos');
      }
    } catch (err: any) {
      console.error('Erro ao excluir artigo:', err);
      const errorMessage = err.message || 'Ocorreu um erro ao excluir o artigo. Por favor, tente novamente.';
      setError(errorMessage);
      showNotification('error', errorMessage);
      setShowConfirmation(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowConfirmation(true);
        }}
        className={`${className || 'text-red-600 hover:text-red-800 focus:outline-none'}`}
        title="Excluir artigo"
        aria-label="Excluir artigo"
        aria-haspopup="dialog"
      >
        {showIcon && <Trash2 className="w-5 h-5 inline mr-1" aria-hidden="true" />}
        {buttonText}
      </button>

      {/* Modal de confirmação */}
      {showConfirmation && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowConfirmation(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirmation-title"
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <h3
              id="delete-confirmation-title"
              className="text-lg font-medium text-gray-900 dark:text-white mb-4"
            >
              Confirmar exclusão
            </h3>

            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita.
            </p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirmation(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete();
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
