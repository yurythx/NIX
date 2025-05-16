'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import mangasService from '../../../services/api/mangas.service';
import { useNotification } from '../../../contexts/NotificationContext';
import { useRouter } from 'next/navigation';

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
  const { showNotification } = useNotification();
  const router = useRouter();

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    try {
      setIsDeleting(true);
      await mangasService.deleteManga(slug);
      showNotification('success', 'Mangá excluído com sucesso!');
      
      // Chamar callback se fornecido
      if (onDelete) {
        onDelete();
      } else {
        // Redirecionar para a página de listagem
        router.push('/mangas');
      }
    } catch (error) {
      console.error('Erro ao excluir mangá:', error);
      showNotification('error', 'Não foi possível excluir o mangá. Tente novamente mais tarde.');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          {isDeleting ? 'Excluindo...' : 'Confirmar'}
        </button>
        <button
          onClick={handleCancel}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      className={className}
      title="Excluir mangá"
    >
      {showIcon && <Trash2 className="w-4 h-4" />}
      {buttonText && <span>{buttonText}</span>}
    </button>
  );
}
