'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import mangasService from '../../../services/api/mangas.service';
import { useNotification } from '../../../contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '../../../components/common/ConfirmationModal';

interface DeleteMangaButtonProps {
  slug: string;
  className?: string;
  buttonText?: string;
  showIcon?: boolean;
  onDelete?: () => void;
}

export default function DeleteMangaButton({
  slug,
  className = 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors',
  buttonText = 'Excluir',
  showIcon = true,
  onDelete
}: DeleteMangaButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await mangasService.deleteManga(slug);
      showNotification('success', 'Mangá excluído com sucesso!');

      // Fechar o modal antes de redirecionar
      setShowConfirm(false);

      // Aumentar o atraso antes de redirecionar para garantir que a animação do modal termine
      setTimeout(() => {
        // Chamar callback se fornecido
        if (onDelete) {
          onDelete();
        } else {
          // Redirecionar para a página de listagem
          console.log('Redirecionando para /mangas após exclusão');

          // Usar apenas router.push para evitar o piscar da tela
          router.push('/mangas');
        }
      }, 500);
    } catch (error: any) {
      console.error('Erro ao excluir mangá:', error);
      setError(error.message || 'Não foi possível excluir o mangá. Tente novamente mais tarde.');
      showNotification('error', 'Não foi possível excluir o mangá. Tente novamente mais tarde.');
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
        title="Excluir mangá"
      >
        {showIcon && <Trash2 className="w-4 h-4" />}
        {buttonText && <span>{buttonText}</span>}
      </button>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Confirmar exclusão"
        message="Tem certeza que deseja excluir este mangá? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        isLoading={isDeleting}
        error={error}
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />
    </>
  );
}
