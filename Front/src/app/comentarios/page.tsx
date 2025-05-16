'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Check, AlertTriangle, Trash2, Filter, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Comment } from '../../types/models';
import { articlesService, commentModerationService } from '../../services/api';
import PageTitle from '../../components/ui/PageTitle';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'next/navigation';

export default function ComentariosPage() {
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();

  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'spam'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Verificar se o usuário está autenticado e é administrador
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && user && !(user as any).is_staff) {
      router.push('/');
      showNotification('error', 'Você não tem permissão para acessar esta página.');
      return;
    }

    // Carregar todos os comentários
    loadComments();
  }, [isAuthenticated, user, router]);

  // Função para carregar comentários
  const loadComments = async () => {
    setIsLoading(true);

    try {
      // Obter todos os comentários de todos os artigos no localStorage
      const allComments: Comment[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key && key.startsWith('article_comments_')) {
          const articleId = parseInt(key.replace('article_comments_', ''), 10);
          const articleComments = await articlesService.getArticleComments(articleId);
          allComments.push(...articleComments);
        }
      }

      setComments(allComments);
      applyFilters(allComments, filter, searchTerm);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      showNotification('error', 'Erro ao carregar comentários.');
      setIsLoading(false);
    }
  };

  // Aplicar filtros aos comentários
  const applyFilters = (commentsToFilter: Comment[], currentFilter: string, term: string) => {
    let result = [...commentsToFilter];

    // Aplicar filtro de status
    if (currentFilter === 'pending') {
      result = result.filter(comment => comment.is_approved === false && comment.is_spam !== true);
    } else if (currentFilter === 'approved') {
      result = result.filter(comment => comment.is_approved === true);
    } else if (currentFilter === 'spam') {
      result = result.filter(comment => comment.is_spam === true);
    }

    // Aplicar filtro de pesquisa
    if (term) {
      const lowerTerm = term.toLowerCase();
      result = result.filter(comment =>
        comment.text.toLowerCase().includes(lowerTerm) ||
        comment.name.toLowerCase().includes(lowerTerm)
      );
    }

    setFilteredComments(result);
  };

  // Formatar data
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

  // Aprovar comentário
  const approveComment = async (commentId: number) => {
    try {
      await commentModerationService.approveComment(commentId);
      showNotification('success', 'Comentário aprovado com sucesso!');
      loadComments();
    } catch (error) {
      console.error('Erro ao aprovar comentário:', error);
      showNotification('error', 'Erro ao aprovar comentário.');
    }
  };

  // Rejeitar comentário
  const rejectComment = async (commentId: number) => {
    try {
      await commentModerationService.rejectComment(commentId);
      showNotification('success', 'Comentário rejeitado com sucesso!');
      loadComments();
    } catch (error) {
      console.error('Erro ao rejeitar comentário:', error);
      showNotification('error', 'Erro ao rejeitar comentário.');
    }
  };

  // Marcar como spam
  const markAsSpam = async (commentId: number) => {
    try {
      await commentModerationService.markAsSpam(commentId);
      showNotification('success', 'Comentário marcado como spam!');
      loadComments();
    } catch (error) {
      console.error('Erro ao marcar comentário como spam:', error);
      showNotification('error', 'Erro ao marcar comentário como spam.');
    }
  };

  // Excluir comentário
  const deleteComment = async (commentId: number) => {
    try {
      await articlesService.deleteComment(commentId);
      showNotification('success', 'Comentário excluído com sucesso!');
      loadComments();
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      showNotification('error', 'Erro ao excluir comentário.');
    }
  };

  // Atualizar filtros
  const handleFilterChange = (newFilter: 'all' | 'pending' | 'approved' | 'spam') => {
    setFilter(newFilter);
    applyFilters(comments, newFilter, searchTerm);
  };

  // Atualizar pesquisa
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    applyFilters(comments, filter, term);
  };

  if (!isAuthenticated || !user || !(user as any).is_staff) {
    return null; // Redirecionando...
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageTitle
        title="Moderação de Comentários"
        icon={<MessageSquare className="w-8 h-8" />}
        description="Gerencie e modere os comentários do site"
      />

      <div className="mt-6 mb-8 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex space-x-2">
          <Button
            onClick={() => handleFilterChange('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
          >
            Todos
          </Button>
          <Button
            onClick={() => handleFilterChange('pending')}
            variant={filter === 'pending' ? 'default' : 'outline'}
          >
            Pendentes
          </Button>
          <Button
            onClick={() => handleFilterChange('approved')}
            variant={filter === 'approved' ? 'default' : 'outline'}
          >
            Aprovados
          </Button>
          <Button
            onClick={() => handleFilterChange('spam')}
            variant={filter === 'spam' ? 'default' : 'outline'}
          >
            Spam
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            placeholder="Pesquisar comentários..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando comentários...</p>
        </div>
      ) : filteredComments.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Nenhum comentário encontrado</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {filter !== 'all'
              ? `Não há comentários ${filter === 'pending' ? 'pendentes' : filter === 'approved' ? 'aprovados' : 'marcados como spam'}.`
              : 'Não há comentários para moderar.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredComments.map(comment => (
            <Card key={comment.id} className="overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
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
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(comment.created_at)}
                  </p>
                </div>

                <div className="flex space-x-2">
                  {comment.is_approved === false && (
                    <Button
                      onClick={() => approveComment(comment.id)}
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Aprovar
                    </Button>
                  )}

                  {comment.is_approved !== false && comment.is_spam !== true && (
                    <Button
                      onClick={() => rejectComment(comment.id)}
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-400 dark:hover:bg-orange-900/20"
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Rejeitar
                    </Button>
                  )}

                  {comment.is_spam !== true && (
                    <Button
                      onClick={() => markAsSpam(comment.id)}
                      variant="outline"
                      size="sm"
                      className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-400 dark:hover:bg-yellow-900/20"
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Spam
                    </Button>
                  )}

                  <Button
                    onClick={() => deleteComment(comment.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>

              <div className="p-4">
                <p className="text-gray-600 dark:text-gray-300">{comment.text}</p>

                {comment.email && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Email: {comment.email}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
