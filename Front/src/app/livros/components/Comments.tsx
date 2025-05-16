'use client';

import { useState, useEffect, FormEvent } from 'react';
import { MessageSquare, Send, Edit2, Trash2, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { Comment, getBookComments, createBookComment, updateComment, deleteComment } from '../../../services/api/comments.service';
import { formatDistanceToNow, ptBR } from '../../../utils/dateUtils';

interface CommentsProps {
  bookSlug: string;
}

export default function Comments({ bookSlug }: CommentsProps) {
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState<Record<number, boolean>>({});

  // Buscar comentários
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setIsLoading(true);
        const commentsData = await getBookComments(bookSlug);
        setComments(commentsData);
      } catch (error) {
        console.error('Erro ao buscar comentários:', error);
        showNotification('error', 'Não foi possível carregar os comentários');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [bookSlug, showNotification]);

  // Enviar novo comentário
  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showNotification('error', 'Você precisa estar autenticado para comentar');
      return;
    }

    if (!newComment.trim()) {
      showNotification('error', 'O comentário não pode estar vazio');
      return;
    }

    try {
      setIsSubmitting(true);

      const commentData = {
        content: newComment,
        parent: replyTo
      };

      const createdComment = await createBookComment(bookSlug, commentData);

      // Atualizar a lista de comentários
      if (replyTo) {
        // Se for uma resposta, adicionar à lista de respostas do comentário pai
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === replyTo
              ? {
                  ...comment,
                  replies: [...(comment.replies || []), createdComment]
                }
              : comment
          )
        );

        // Mostrar as respostas do comentário pai
        setShowReplies(prev => ({
          ...prev,
          [replyTo]: true
        }));

        // Limpar o estado de resposta
        setReplyTo(null);
      } else {
        // Se for um comentário principal, adicionar à lista principal
        setComments(prevComments => [createdComment, ...prevComments]);
      }

      // Limpar o campo de comentário
      setNewComment('');

      showNotification('success', 'Comentário adicionado com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      showNotification('error', 'Não foi possível adicionar o comentário');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Iniciar edição de comentário
  const handleStartEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  // Salvar edição
  const handleSaveEdit = async (commentId: number) => {
    if (!editContent.trim()) {
      showNotification('error', 'O comentário não pode estar vazio');
      return;
    }

    try {
      setIsSubmitting(true);

      const updatedComment = await updateComment(commentId, editContent);

      // Atualizar a lista de comentários
      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.id === commentId) {
            return updatedComment;
          }

          // Verificar se o comentário está nas respostas
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId ? updatedComment : reply
              )
            };
          }

          return comment;
        })
      );

      // Limpar o estado de edição
      setEditingComment(null);
      setEditContent('');

      showNotification('success', 'Comentário atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar comentário:', error);
      showNotification('error', 'Não foi possível atualizar o comentário');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excluir comentário
  const handleDeleteComment = async (commentId: number, parentId?: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este comentário?')) {
      return;
    }

    try {
      await deleteComment(commentId);

      // Atualizar a lista de comentários
      if (parentId) {
        // Se for uma resposta, remover da lista de respostas do comentário pai
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === parentId
              ? {
                  ...comment,
                  replies: (comment.replies || []).filter(reply => reply.id !== commentId)
                }
              : comment
          )
        );
      } else {
        // Se for um comentário principal, remover da lista principal
        setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
      }

      showNotification('success', 'Comentário excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      showNotification('error', 'Não foi possível excluir o comentário');
    }
  };

  // Alternar exibição de respostas
  const toggleReplies = (commentId: number) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Formatar data relativa
  const formatRelativeDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString));
    } catch (error) {
      return dateString;
    }
  };

  // Renderizar um comentário
  const renderComment = (comment: Comment, isReply = false, parentId?: number) => {
    const isEditing = editingComment === comment.id;
    const canModify = isAuthenticated && user && (user.id === comment.user.id || user.is_staff || user.is_superuser);
    const hasReplies = comment.replies && comment.replies.length > 0;
    const showingReplies = showReplies[comment.id];

    return (
      <div
        key={comment.id}
        className={`p-4 ${isReply ? 'ml-8 border-l-2 border-indigo-200 dark:border-indigo-800' : 'border-b border-gray-200 dark:border-gray-700'}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 flex-shrink-0">
            {comment.user.avatar ? (
              <img
                src={comment.user.avatar}
                alt={comment.user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              comment.user.username.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {comment.user.username}
                </span>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  {formatRelativeDate(comment.created_at)}
                </span>
              </div>

              {canModify && !isEditing && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(comment)}
                    className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id, parentId)}
                    className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                  rows={3}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSaveEdit(comment.id)}
                    disabled={isSubmitting}
                    className="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50"
                  >
                    {isSubmitting ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-gray-700 dark:text-gray-300">
                {comment.content}
              </p>
            )}

            {!isEditing && !isReply && (
              <div className="mt-2 flex items-center gap-4">
                {isAuthenticated && (
                  <button
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Reply className="w-3 h-3" />
                    {replyTo === comment.id ? 'Cancelar resposta' : 'Responder'}
                  </button>
                )}

                {hasReplies && (
                  <button
                    onClick={() => toggleReplies(comment.id)}
                    className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1"
                  >
                    {showingReplies ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Ocultar respostas ({comment.replies?.length})
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Ver respostas ({comment.replies?.length})
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Formulário de resposta */}
            {replyTo === comment.id && (
              <form onSubmit={handleSubmitComment} className="mt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva sua resposta..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* Respostas */}
            {hasReplies && showingReplies && (
              <div className="mt-3 space-y-3">
                {comment.replies?.map(reply => renderComment(reply, true, comment.id))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
          Comentários ({comments.length})
        </h2>
      </div>

      {/* Formulário de comentário */}
      {isAuthenticated ? (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmitComment} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                user?.username.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escreva um comentário..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Enviando...' : 'Enviar comentário'}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 text-center border-b border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Faça login para deixar um comentário
          </p>
        </div>
      )}

      {/* Lista de comentários */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando comentários...</p>
          </div>
        ) : comments.length > 0 ? (
          comments.map(comment => renderComment(comment))
        ) : (
          <div className="p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
          </div>
        )}
      </div>
    </div>
  );
}
