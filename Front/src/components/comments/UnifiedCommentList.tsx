'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Reply, Trash2, Edit2, Send, AlertTriangle, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import unifiedCommentsService, {
  UnifiedComment,
  ContentType,
  UnifiedCommentCreateData
} from '../../services/api/unified-comments.service';

interface UnifiedCommentFormProps {
  contentType: ContentType;
  contentId: number | string;
  parentId?: number | null;
  onCommentAdded: () => void;
  onCancel?: () => void;
  isReply?: boolean;
}

const UnifiedCommentForm: React.FC<UnifiedCommentFormProps> = ({
  contentType,
  contentId,
  parentId = null,
  onCommentAdded,
  onCancel,
  isReply = false
}) => {
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      showNotification('error', 'O comentário não pode estar vazio');
      return;
    }

    // Verificar se o usuário está autenticado ou se forneceu nome e email
    if (!isAuthenticated) {
      if (!name.trim()) {
        showNotification('error', 'Por favor, forneça seu nome');
        return;
      }
      if (!email.trim()) {
        showNotification('error', 'Por favor, forneça seu email');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const commentData: UnifiedCommentCreateData = {
        content: content.trim(),
        parent: parentId,
      };

      // Adicionar nome e email para comentários anônimos
      if (!isAuthenticated) {
        commentData.name = name.trim();
        if (email.trim()) {
          commentData.email = email.trim();
        }
      }

      await unifiedCommentsService.createComment(contentType, contentId, commentData);

      // Limpar o formulário
      setContent('');
      setName('');
      setEmail('');

      // Notificar sucesso
      showNotification('success', isReply ? 'Resposta enviada com sucesso' : 'Comentário enviado com sucesso');

      // Notificar o componente pai
      onCommentAdded();
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      showNotification('error', 'Erro ao enviar comentário. Tente novamente mais tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`mt-4 ${isReply ? 'pl-4' : ''}`}>
      <div className="space-y-3">
        {!isAuthenticated && (
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>
            <div className="flex-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isReply ? 'Sua resposta' : 'Seu comentário'}
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={isReply ? 2 : 3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !content.trim() || (!isAuthenticated && (!name.trim() || !email.trim()))}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Enviando...' : isReply ? 'Responder' : 'Comentar'}
          </button>
        </div>
      </div>
    </form>
  );
};

interface UnifiedCommentItemProps {
  comment: UnifiedComment;
  contentType: ContentType;
  contentId: number | string;
  onCommentAdded: () => void;
}

const UnifiedCommentItem: React.FC<UnifiedCommentItemProps> = ({
  comment,
  contentType,
  contentId,
  onCommentAdded
}) => {
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  // Verificar se o usuário pode modificar este comentário
  const canModify = isAuthenticated && user && (
    user.is_staff ||
    (comment.user && comment.user.id === user.id)
  );

  // Obter o nome de exibição do autor do comentário
  const authorName = comment.user
    ? comment.user.username
    : comment.name || 'Anônimo';

  // Formatar data relativa
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h atrás`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;

    return date.toLocaleDateString('pt-BR');
  };

  // Excluir comentário
  const handleDelete = async () => {
    if (!canModify) return;

    if (confirm('Tem certeza que deseja excluir este comentário?')) {
      try {
        await unifiedCommentsService.deleteComment(comment.id);
        showNotification('success', 'Comentário excluído com sucesso');
        onCommentAdded(); // Recarregar comentários
      } catch (error) {
        console.error('Erro ao excluir comentário:', error);
        showNotification('error', 'Erro ao excluir comentário');
      }
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {comment.user?.avatar ? (
            <img
              src={comment.user.avatar}
              alt={authorName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <span className="text-indigo-700 dark:text-indigo-300 font-medium">
                {authorName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                {authorName}
              </span>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {formatRelativeDate(comment.created_at)}
              </span>

              {comment.is_approved === false && (
                <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                  Aguardando aprovação
                </span>
              )}

              {comment.is_spam === true && (
                <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 px-2 py-0.5 rounded-full">
                  Spam
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 flex items-center gap-1"
                >
                  <Reply className="w-4 h-4" />
                  <span className="text-xs">Responder</span>
                </button>
              )}

              {canModify && (
                <button
                  onClick={handleDelete}
                  className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-xs">Excluir</span>
                </button>
              )}
            </div>
          </div>

          <p className="mt-2 text-gray-600 dark:text-gray-300">{comment.content}</p>

          {/* Formulário de resposta */}
          {showReplyForm && (
            <div className="mt-3">
              <UnifiedCommentForm
                contentType={contentType}
                contentId={contentId}
                parentId={comment.id}
                onCommentAdded={() => {
                  onCommentAdded();
                  setShowReplyForm(false);
                }}
                onCancel={() => setShowReplyForm(false)}
                isReply={true}
              />
            </div>
          )}

          {/* Respostas */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center mb-2">
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
                >
                  {showReplies ? 'Ocultar' : 'Mostrar'} {comment.replies.length} {comment.replies.length === 1 ? 'resposta' : 'respostas'}
                </button>
              </div>

              {showReplies && (
                <div className="space-y-3 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                  {comment.replies.map(reply => (
                    <UnifiedCommentItem
                      key={reply.id}
                      comment={reply}
                      contentType={contentType}
                      contentId={contentId}
                      onCommentAdded={onCommentAdded}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface UnifiedCommentListProps {
  contentType: ContentType;
  contentId: number | string;
  title?: string;
  showForm?: boolean;
}

const UnifiedCommentList: React.FC<UnifiedCommentListProps> = ({
  contentType,
  contentId,
  title = 'Comentários',
  showForm = true
}) => {
  const { showNotification } = useNotification();
  const [comments, setComments] = useState<UnifiedComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar comentários
  const loadComments = async () => {
    try {
      setIsLoading(true);
      const data = await unifiedCommentsService.getComments(contentType, contentId);
      setComments(data);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      showNotification('error', 'Erro ao carregar comentários');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar comentários ao montar o componente
  useEffect(() => {
    loadComments();
  }, [contentType, contentId]);

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
          {title} ({comments.length})
        </h2>
      </div>

      {isLoading ? (
        <div className="p-6 text-center">
          <div className="animate-pulse flex justify-center">
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Carregando comentários...</p>
        </div>
      ) : (
        <>
          {showForm && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <UnifiedCommentForm
                contentType={contentType}
                contentId={contentId}
                onCommentAdded={loadComments}
              />
            </div>
          )}

          {comments.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {comments.map(comment => (
                <UnifiedCommentItem
                  key={comment.id}
                  comment={comment}
                  contentType={contentType}
                  contentId={contentId}
                  onCommentAdded={loadComments}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UnifiedCommentList;
