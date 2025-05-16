'use client';

import React, { useState, createContext } from 'react';
import { Comment } from '../../../types/models';
import { MessageSquare, Reply, Trash2, Check, AlertTriangle } from 'lucide-react';
import CommentForm from './CommentForm';
import { useAuth } from '../../../contexts/AuthContext';
import * as articlesService from '../../../services/api/articles.service';
import * as commentModerationService from '../../../services/api/comment-moderation.service';
import { useNotification } from '../../../contexts/NotificationContext';

// Criar um contexto para compartilhar os comentários entre componentes
const CommentsContext = createContext<Comment[]>([]);

interface CommentItemProps {
  comment: Comment;
  articleId: number;
  articleSlug: string;
  onCommentAdded: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, articleId, articleSlug, onCommentAdded }) => {
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const [showReplyForm, setShowReplyForm] = useState(false);
  // Estado para controlar quais respostas têm formulários de resposta abertos
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  // Obter todos os comentários do contexto
  const allComments = React.useContext(CommentsContext);

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };



  return (
    <div className={`${comment.parent ? 'ml-6 border-l-2 border-indigo-200 dark:border-indigo-900' : ''} pl-4 mb-4 relative`}>
      {/* Linha conectora para criar efeito de árvore */}
      {comment.parent && (
        <div className="absolute -left-0 top-0 w-4 h-6 border-b-2 border-indigo-200 dark:border-indigo-900"></div>
      )}
      <div className={`${comment.parent ? 'bg-gray-50 dark:bg-gray-850' : 'bg-white dark:bg-gray-800'} p-4 rounded-lg shadow-sm`}>
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
              {comment.name}
              {comment.parent && (
                <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                  Resposta
                </span>
              )}
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
            </h4>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{formatDate(comment.created_at)}</span>
              {comment.updated_at && comment.updated_at !== comment.created_at && (
                <span className="ml-2 italic">(editado)</span>
              )}
              {comment.reply_count && comment.reply_count > 0 && (
                <span className="ml-2 flex items-center">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {comment.reply_count} {comment.reply_count === 1 ? 'resposta' : 'respostas'}
                </span>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            {/* Botão de resposta - disponível para todos se o comentário estiver aprovado */}
            {(comment.is_approved !== false && comment.is_spam !== true) && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 rounded-md focus:outline-none transition-colors"
                title={showReplyForm ? 'Cancelar resposta' : 'Responder'}
              >
                <Reply className="w-4 h-4" />
                <span className="text-xs">{showReplyForm ? 'Cancelar' : 'Responder'}</span>
              </button>
            )}

            {/* Botões de moderação - apenas para administradores */}
            {isAuthenticated && user && user.is_staff && (
              <>
                {/* Botão de aprovar */}
                {comment.is_approved === false && (
                  <button
                    onClick={() => {
                      // Lógica para aprovar comentário
                      if (confirm('Deseja aprovar este comentário?')) {
                        commentModerationService.approveComment(comment.id)
                          .then(() => {
                            showNotification('success', 'Comentário aprovado com sucesso!');
                            onCommentAdded(); // Recarregar comentários
                          })
                          .catch(error => {
                            console.error('Erro ao aprovar comentário:', error);
                            showNotification('error', 'Erro ao aprovar comentário.');
                          });
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 rounded-md focus:outline-none transition-colors"
                    title="Aprovar comentário"
                  >
                    <Check className="w-4 h-4" />
                    <span className="text-xs">Aprovar</span>
                  </button>
                )}

                {/* Botão de rejeitar (se não for spam) */}
                {comment.is_approved !== false && comment.is_spam !== true && (
                  <button
                    onClick={() => {
                      // Lógica para rejeitar comentário
                      if (confirm('Deseja rejeitar este comentário?')) {
                        commentModerationService.rejectComment(comment.id)
                          .then(() => {
                            showNotification('success', 'Comentário rejeitado com sucesso!');
                            onCommentAdded(); // Recarregar comentários
                          })
                          .catch(error => {
                            console.error('Erro ao rejeitar comentário:', error);
                            showNotification('error', 'Erro ao rejeitar comentário.');
                          });
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 rounded-md focus:outline-none transition-colors"
                    title="Rejeitar comentário"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs">Rejeitar</span>
                  </button>
                )}

                {/* Botão de marcar como spam */}
                {comment.is_spam !== true && (
                  <button
                    onClick={() => {
                      // Lógica para marcar como spam
                      if (confirm('Deseja marcar este comentário como spam?')) {
                        commentModerationService.markAsSpam(comment.id)
                          .then(() => {
                            showNotification('success', 'Comentário marcado como spam!');
                            onCommentAdded(); // Recarregar comentários
                          })
                          .catch(error => {
                            console.error('Erro ao marcar comentário como spam:', error);
                            showNotification('error', 'Erro ao marcar comentário como spam.');
                          });
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 rounded-md focus:outline-none transition-colors"
                    title="Marcar como spam"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs">Spam</span>
                  </button>
                )}

                {/* Botão de exclusão para administradores */}
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir este comentário?')) {
                      articlesService.deleteComment(comment.id)
                        .then(() => {
                          showNotification('success', 'Comentário excluído com sucesso!');
                          onCommentAdded(); // Recarregar comentários
                        })
                        .catch(error => {
                          console.error('Erro ao excluir comentário:', error);
                          showNotification('error', 'Erro ao excluir comentário.');
                        });
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-md focus:outline-none transition-colors"
                  title="Excluir comentário"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-xs">Excluir</span>
                </button>
              </>
            )}

            {/* Botão de exclusão para usuários não-admin (apenas autor) */}
            {isAuthenticated && user && !user.is_staff && (
              // Verificar se o usuário é o autor do comentário (comparando nome ou email)
              (user.email === comment.email ||
               user.username === comment.name ||
               `${user.first_name} ${user.last_name}`.trim() === comment.name) && (
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir este comentário?')) {
                      articlesService.deleteComment(comment.id)
                        .then(() => {
                          showNotification('success', 'Comentário excluído com sucesso!');
                          onCommentAdded();
                        })
                        .catch(err => {
                          console.error('Erro ao excluir comentário:', err);
                          showNotification('error', 'Não foi possível excluir o comentário.');
                        });
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-md focus:outline-none transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-xs">Excluir</span>
                </button>
              )
            )}
          </div>
        </div>

        <p className="mt-2 text-gray-600 dark:text-gray-300">{comment.text}</p>
      </div>

      {showReplyForm && (
        <div className="mt-2 ml-4">
          <CommentForm
            articleId={articleId}
            articleSlug={articleSlug}
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



      {/* Exibir respostas aninhadas para todos os comentários que têm respostas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-md mb-4 border border-indigo-100 dark:border-indigo-800/50">
            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-indigo-500" />
              <span className="font-medium">
                Respostas ({comment.replies.filter(r => r.is_approved !== false && r.is_spam !== true).length})
              </span>
              {comment.replies.some(r => r.is_approved === false) && (
                <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                  {comment.replies.filter(r => r.is_approved === false && r.is_spam !== true).length} pendente(s)
                </span>
              )}
            </p>
          </div>

          {comment.replies
            // Filtrar respostas: mostrar todas para admins, apenas aprovadas para outros usuários
            .filter(reply => user?.is_staff || (reply.is_approved !== false && reply.is_spam !== true))
            .map((reply) => (
            <div
              key={reply.id}
              className={`ml-4 pl-4 border-l-2 ${
                allComments.find(c => c.id === reply.parent && c.parent !== null)
                  ? 'border-purple-200 dark:border-purple-800'
                  : 'border-indigo-200 dark:border-indigo-800'
              } relative`}
            >
              {/* Linha conectora */}
              <div className={`absolute -left-0 top-0 h-6 w-4 border-b-2 ${
                allComments.find(c => c.id === reply.parent && c.parent !== null)
                  ? 'border-purple-200 dark:border-purple-800'
                  : 'border-indigo-200 dark:border-indigo-800'
              }`}></div>

              {/* Cabeçalho da resposta */}
              <div className={`${
                allComments.find(c => c.id === reply.parent && c.parent !== null)
                  ? 'bg-purple-50/50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-900/30'
                  : 'bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30'
              } p-2 rounded-t-md`}>
                <p className={`text-xs ${
                  allComments.find(c => c.id === reply.parent && c.parent !== null)
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-indigo-600 dark:text-indigo-400'
                } flex items-center`}>
                  <Reply className="w-3 h-3 mr-1" />
                  {reply.parent === comment.id ? (
                    <>Resposta ao comentário de <span className="font-medium ml-1">{comment.name}</span></>
                  ) : (
                    <>
                      Resposta a <span className="font-medium ml-1">
                        {allComments.find(c => c.id === reply.parent)?.name || "outra resposta"}
                      </span>
                    </>
                  )}
                </p>
              </div>

              {/* Conteúdo da resposta */}
              <div className={`${
                allComments.find(c => c.id === reply.parent && c.parent !== null)
                  ? 'bg-white/90 dark:bg-gray-800/90 border border-purple-100 dark:border-purple-900/20'
                  : 'bg-white dark:bg-gray-800'
              } p-4 rounded-b-md shadow-sm`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center flex-wrap">
                      {reply.name}
                      {reply.parent === comment.id ? (
                        <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                          Resposta direta
                        </span>
                      ) : (
                        <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full">
                          Resposta aninhada
                        </span>
                      )}

                      {/* Indicador de resposta a resposta */}
                      {allComments.find(c => c.id === reply.parent && c.parent !== null) && (
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          Resposta de resposta
                        </span>
                      )}
                      {reply.is_approved === false && (
                        <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                          Aguardando aprovação
                        </span>
                      )}
                      {reply.is_spam === true && (
                        <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 px-2 py-0.5 rounded-full">
                          Spam
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(reply.created_at)}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    {/* Botão de resposta - disponível para todos se o comentário estiver aprovado */}
                    {(reply.is_approved !== false && reply.is_spam !== true) && (
                      <button
                        onClick={() => {
                          // Alternar o estado para mostrar/ocultar o formulário de resposta
                          setReplyingToId(replyingToId === reply.id ? null : reply.id);
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 rounded-md focus:outline-none transition-colors"
                      >
                        <Reply className="w-4 h-4" />
                        <span className="text-xs">{replyingToId === reply.id ? 'Cancelar' : 'Responder'}</span>
                      </button>
                    )}

                    {/* Botões de moderação - apenas para administradores */}
                    {isAuthenticated && user && user.is_staff && (
                      <>
                        {/* Botão de aprovar */}
                        {reply.is_approved === false && (
                          <button
                            onClick={() => {
                              if (confirm('Deseja aprovar esta resposta?')) {
                                commentModerationService.approveComment(reply.id)
                                  .then(() => {
                                    showNotification('success', 'Resposta aprovada com sucesso!');
                                    onCommentAdded(); // Recarregar comentários
                                  })
                                  .catch(error => {
                                    console.error('Erro ao aprovar resposta:', error);
                                    showNotification('error', 'Erro ao aprovar resposta.');
                                  });
                              }
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 rounded-md focus:outline-none transition-colors"
                            title="Aprovar resposta"
                          >
                            <Check className="w-4 h-4" />
                            <span className="text-xs">Aprovar</span>
                          </button>
                        )}

                        {/* Botão de rejeitar (se não for spam) */}
                        {reply.is_approved !== false && reply.is_spam !== true && (
                          <button
                            onClick={() => {
                              if (confirm('Deseja rejeitar esta resposta?')) {
                                commentModerationService.rejectComment(reply.id)
                                  .then(() => {
                                    showNotification('success', 'Resposta rejeitada com sucesso!');
                                    onCommentAdded(); // Recarregar comentários
                                  })
                                  .catch(error => {
                                    console.error('Erro ao rejeitar resposta:', error);
                                    showNotification('error', 'Erro ao rejeitar resposta.');
                                  });
                              }
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 rounded-md focus:outline-none transition-colors"
                            title="Rejeitar resposta"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs">Rejeitar</span>
                          </button>
                        )}

                        {/* Botão de marcar como spam */}
                        {reply.is_spam !== true && (
                          <button
                            onClick={() => {
                              if (confirm('Deseja marcar esta resposta como spam?')) {
                                commentModerationService.markAsSpam(reply.id)
                                  .then(() => {
                                    showNotification('success', 'Resposta marcada como spam!');
                                    onCommentAdded(); // Recarregar comentários
                                  })
                                  .catch(error => {
                                    console.error('Erro ao marcar resposta como spam:', error);
                                    showNotification('error', 'Erro ao marcar resposta como spam.');
                                  });
                              }
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 rounded-md focus:outline-none transition-colors"
                            title="Marcar como spam"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs">Spam</span>
                          </button>
                        )}

                        {/* Botão de exclusão */}
                        <button
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta resposta?')) {
                              articlesService.deleteComment(reply.id)
                                .then(() => {
                                  showNotification('success', 'Resposta excluída com sucesso!');
                                  onCommentAdded(); // Recarregar comentários
                                })
                                .catch(error => {
                                  console.error('Erro ao excluir resposta:', error);
                                  showNotification('error', 'Erro ao excluir resposta.');
                                });
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-md focus:outline-none transition-colors"
                          title="Excluir resposta"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-xs">Excluir</span>
                        </button>
                      </>
                    )}

                    {/* Botão de exclusão para usuários não-admin (apenas autor) */}
                    {isAuthenticated && user && !user.is_staff && (
                      // Verificar se o usuário é o autor da resposta (comparando nome ou email)
                      (user.email === reply.email ||
                       user.username === reply.name ||
                       `${user.first_name} ${user.last_name}`.trim() === reply.name) && (
                        <button
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta resposta?')) {
                              articlesService.deleteComment(reply.id)
                                .then(() => {
                                  showNotification('success', 'Resposta excluída com sucesso!');
                                  onCommentAdded();
                                })
                                .catch(err => {
                                  console.error('Erro ao excluir resposta:', err);
                                  showNotification('error', 'Não foi possível excluir a resposta.');
                                });
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-md focus:outline-none transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-xs">Excluir</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                <p className="mt-2 text-gray-600 dark:text-gray-300">{reply.text}</p>

                {/* Formulário de resposta (visível apenas quando replyingToId === reply.id) */}
                {replyingToId === reply.id && (
                  <div className="mt-4">
                    <div className={`${
                      allComments.find(c => c.id === reply.parent && c.parent !== null)
                        ? 'bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30'
                        : 'bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30'
                    } p-4 rounded-lg`}>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <Reply className="w-3 h-3 mr-1" />
                        Respondendo a <span className="font-medium ml-1">{reply.name}</span>
                        {allComments.find(c => c.id === reply.parent && c.parent !== null) && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            Resposta aninhada
                          </span>
                        )}
                      </h5>
                      <CommentForm
                        articleId={articleId}
                        articleSlug={articleSlug}
                        parentId={reply.id}
                        onCommentAdded={() => {
                          onCommentAdded();
                          setReplyingToId(null);
                        }}
                        onCancel={() => {
                          setReplyingToId(null);
                        }}
                        isReply={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface CommentListProps {
  comments: Comment[];
  articleId: number;
  articleSlug: string;
  onCommentAdded: () => void;
}

const CommentList: React.FC<CommentListProps> = ({ comments, articleId, articleSlug, onCommentAdded }) => {
  // Obter informações do usuário para verificar permissões
  const { user } = useAuth();

  // Função para processar os comentários e criar uma estrutura de árvore
  const processComments = (): Comment[] => {
    // Criar um mapa para armazenar os comentários por ID
    const commentMap = new Map<number, Comment>();

    // Primeiro, adicionar todos os comentários ao mapa com arrays de respostas vazios
    comments.forEach(comment => {
      // Garantir que o ID seja um número
      const commentId = typeof comment.id === 'string' ? parseInt(comment.id, 10) : comment.id;

      // Verificar se o comentário já existe no mapa (pode acontecer em caso de duplicação)
      if (!commentMap.has(commentId)) {
        commentMap.set(commentId, {
          ...comment,
          id: commentId, // Garantir que o ID seja um número
          parent: comment.parent, // Manter o parent como está
          replies: [] // Inicializar array vazio para respostas
        });
      }
    });

    // Função para normalizar o ID do pai
    const normalizeParentId = (parent: any): number | null => {
      if (parent === null || parent === undefined || parent === 0) {
        return null;
      }
      return typeof parent === 'string' ? parseInt(parent, 10) : parent;
    };

    // Construir a árvore de comentários
    comments.forEach(comment => {
      const commentId = typeof comment.id === 'string' ? parseInt(comment.id, 10) : comment.id;
      const parentId = normalizeParentId(comment.parent);

      // Pular se o comentário não existir no mapa
      if (!commentMap.has(commentId)) return;

      // Se o comentário tem um pai, adicioná-lo às respostas do pai
      if (parentId !== null && commentMap.has(parentId)) {
        const parentComment = commentMap.get(parentId)!;
        if (!parentComment.replies) parentComment.replies = [];

        // Verificar se este comentário já está nas respostas do pai
        const alreadyInReplies = parentComment.replies.some(reply => reply.id === commentId);

        if (!alreadyInReplies) {
          // Adicionar esta resposta às respostas do pai
          parentComment.replies.push(commentMap.get(commentId)!);
        }
      }
    });

    // Coletar comentários de nível superior
    const topLevelComments: Comment[] = [];
    commentMap.forEach(comment => {
      const parentId = normalizeParentId(comment.parent);

      // Se o comentário não tem pai, é de nível superior
      if (parentId === null) {
        topLevelComments.push(comment);
      }
    });

    // Ordenar os comentários de nível superior por data (mais recentes primeiro)
    topLevelComments.sort((a: Comment, b: Comment) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Função recursiva para ordenar as respostas
    const sortReplies = (comment: Comment): void => {
      if (comment.replies && comment.replies.length > 0) {
        // Ordenar as respostas por data (mais antigas primeiro)
        comment.replies.sort((a: Comment, b: Comment) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Ordenar recursivamente as respostas das respostas
        comment.replies.forEach(reply => sortReplies(reply));
      }
    };

    // Aplicar ordenação recursiva
    topLevelComments.forEach(comment => sortReplies(comment));

    // Log para debug
    console.log('Árvore de comentários processada:', JSON.stringify(topLevelComments, null, 2));

    return topLevelComments;
  };

  // Construir a árvore de comentários
  const commentTree = processComments();

  return (
    <CommentsContext.Provider value={comments}>
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
          <MessageSquare className="w-5 h-5 mr-2" />
          Comentários ({comments.filter(c => c.is_approved !== false && c.is_spam !== true).length})
          {comments.some(c => c.is_approved === false) && (
            <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full">
              {comments.filter(c => c.is_approved === false && c.is_spam !== true).length} pendente(s)
            </span>
          )}
        </h3>

        {comments.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">Nenhum comentário ainda.</p>
            <p className="text-gray-500 dark:text-gray-500 mt-1">Seja o primeiro a comentar neste artigo!</p>
          </div>
        ) : commentTree.length === 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-900/30 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-yellow-400 dark:text-yellow-500 mb-3" />
            <p className="text-yellow-600 dark:text-yellow-400 font-medium">Todos os comentários estão aguardando aprovação.</p>
            <p className="text-yellow-500 dark:text-yellow-500 mt-1">Os comentários serão exibidos após serem aprovados por um moderador.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {commentTree
              // Filtrar comentários: mostrar todos para admins, apenas aprovados para outros usuários
              .filter(comment => user?.is_staff || (comment.is_approved !== false && comment.is_spam !== true))
              .map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                articleId={articleId}
                articleSlug={articleSlug}
                onCommentAdded={onCommentAdded}
              />
            ))}
          </div>
        )}
      </div>
    </CommentsContext.Provider>
  );
};

export default CommentList;
