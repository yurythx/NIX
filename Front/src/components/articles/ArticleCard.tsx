'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Article } from '../../types/models';
import { Clock, MessageSquare, Tag, Edit, Trash2, MoreVertical } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { articlesService } from '../../services/api';

interface ArticleCardProps {
  article: Article;
  onDelete?: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onDelete }) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Verificar se o usuário é o autor do artigo ou um administrador
  const canEdit = isAuthenticated && user && (
    user.is_staff || user.is_superuser || (article.author_id && user.id === article.author_id)
  );

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  // Extrair um resumo do conteúdo (primeiros 150 caracteres)
  const getExcerpt = (content: string) => {
    // Remover tags HTML
    const plainText = content.replace(/<[^>]+>/g, '');
    return plainText.length > 150 ? `${plainText.substring(0, 150)}...` : plainText;
  };

  // Função para excluir o artigo
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDeleting) return;

    try {
      setIsDeleting(true);
      await articlesService.deleteArticle(article.slug);
      showNotification('success', 'Artigo excluído com sucesso!');

      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Erro ao excluir artigo:', error);
      showNotification('error', 'Não foi possível excluir o artigo. Por favor, tente novamente.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Função para editar o artigo
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/artigos/${article.slug}/editar`);
  };

  return (
    <div className="relative group">
      <Link href={`/artigos/${article.slug}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {article.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {getExcerpt(article.content)}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {article.category && (
              <div className="flex items-center mb-2 text-sm text-indigo-600 dark:text-indigo-400">
                <Tag className="w-4 h-4 mr-1" />
                <span>{article.category.name}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(article.created_at)}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-4 h-4" />
                <span>{article.comments_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Botões de ação (apenas para usuários autorizados) */}
      {canEdit && (
        <div className="absolute top-2 right-2">
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showActions && (
              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleEdit}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                    setShowActions(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowDeleteConfirm(false);
        }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirmar exclusão</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Tem certeza que deseja excluir o artigo "{article.title}"? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleCard;
