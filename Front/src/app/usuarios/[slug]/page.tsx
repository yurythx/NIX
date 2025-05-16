'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import * as usersService from '../../../services/api/users.service';
import * as articlesService from '../../../services/api/articles.service';
import { UserDetail, Article, Comment } from '../../../types/models';
import {
  User as UserIcon,
  Mail,
  Calendar,
  Briefcase,
  Edit,
  ArrowLeft,
  Shield,
  ShieldCheck,
  AlertCircle,
  Settings,
  FileText,
  MessageSquare,
  Clock,
  ExternalLink,
  Trash2,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface UserPageProps {
  params: {
    slug: string;
  };
}

export default function UserDetailPage({ params }: UserPageProps) {
  const { slug } = params;
  const router = useRouter();
  const { isAuthenticated, user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [recentComments, setRecentComments] = useState<Comment[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Carregar dados do usuário
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await usersService.getUserBySlug(slug);
        setUser(data);
      } catch (err: any) {
        console.error('Erro ao carregar usuário:', err);
        setError(err.message || 'Erro ao carregar usuário');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && slug) {
      fetchUser();
    }
  }, [isAuthenticated, slug]);

  // Carregar artigos recentes do usuário
  useEffect(() => {
    const fetchRecentArticles = async () => {
      if (!user) return;

      try {
        setLoadingArticles(true);
        // Aqui você precisaria implementar um endpoint para buscar artigos por autor
        // Por enquanto, vamos usar os artigos recentes do usuário se disponíveis
        if (user.last_articles && user.last_articles.length > 0) {
          setRecentArticles(user.last_articles);
        } else {
          // Simulação - em produção, você usaria um endpoint real
          const articles = await articlesService.getArticles({ author: user.id, limit: 5 });
          setRecentArticles(articles.results || []);
        }
      } catch (err: any) {
        console.error('Erro ao carregar artigos recentes:', err);
      } finally {
        setLoadingArticles(false);
      }
    };

    if (user) {
      fetchRecentArticles();
    }
  }, [user]);

  // Carregar comentários recentes do usuário
  useEffect(() => {
    const fetchRecentComments = async () => {
      if (!user) return;

      try {
        setLoadingComments(true);
        // Aqui você precisaria implementar um endpoint para buscar comentários por usuário
        // Por enquanto, vamos usar os comentários recentes do usuário se disponíveis
        if (user.last_comments && user.last_comments.length > 0) {
          setRecentComments(user.last_comments);
        }
        // Caso contrário, não temos uma maneira fácil de buscar comentários por usuário
        // sem um endpoint específico
      } catch (err: any) {
        console.error('Erro ao carregar comentários recentes:', err);
      } finally {
        setLoadingComments(false);
      }
    };

    if (user) {
      fetchRecentComments();
    }
  }, [user]);

  // Função para excluir usuário
  const handleDeleteUser = async () => {
    try {
      setIsDeleting(true);
      await usersService.deleteUser(slug);
      showNotification('success', 'Usuário excluído com sucesso');
      router.push('/usuarios');
    } catch (err: any) {
      console.error('Erro ao excluir usuário:', err);
      showNotification('error', err.message || 'Erro ao excluir usuário');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Verificar se o usuário atual é administrador
  const isAdmin = currentUser?.is_staff || currentUser?.is_superuser;

  // Verificar se o usuário atual é o próprio usuário ou um administrador
  const canEdit = isAdmin || currentUser?.slug === slug;

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/usuarios" className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Detalhes do Usuário</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : user ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center md:items-start">
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="h-32 w-32 rounded-full object-cover border-4 border-indigo-100 dark:border-indigo-900"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <UserIcon className="h-16 w-16 text-indigo-600 dark:text-indigo-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.username}
                </h2>

                <p className="text-gray-600 dark:text-gray-400 mb-2">@{user.username}</p>

                {user.position && (
                  <p className="text-indigo-600 dark:text-indigo-400 flex items-center justify-center md:justify-start mb-2">
                    <Briefcase className="w-4 h-4 mr-2" />
                    {user.position}
                  </p>
                )}

                <div className="flex items-center justify-center md:justify-start mb-2">
                  <Mail className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{user.email}</span>
                </div>

                <div className="flex items-center justify-center md:justify-start mb-4">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Membro desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {(user.is_staff || user.is_superuser) && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 mb-4">
                    <Shield className="w-4 h-4 mr-1" />
                    {user.is_superuser ? 'Administrador' : 'Equipe'}
                  </div>
                )}

                {canEdit && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                    <Link
                      href={`/usuarios/${user.slug}/editar`}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Perfil
                    </Link>

                    <Link
                      href={`/usuarios/${user.slug}/configuracoes`}
                      className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configurações
                    </Link>

                    {isAdmin && !canEdit && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Usuário
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {user.bio && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Biografia</h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{user.bio}</p>
            </div>
          )}

          <div className="p-6 bg-gray-50 dark:bg-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Adicionais</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h4>
                <p className="text-gray-900 dark:text-white flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {user.is_active ? 'Ativo' : 'Inativo'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Último acesso</h4>
                <p className="text-gray-900 dark:text-white">
                  {user.last_login
                    ? new Date(user.last_login).toLocaleString('pt-BR')
                    : 'Nunca acessou'}
                </p>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estatísticas</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Artigos publicados</h4>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{user.articles_count || 0}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex items-center">
                <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 p-3 rounded-full">
                  <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Comentários</h4>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{user.comments_count || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Artigos recentes */}
          {(recentArticles.length > 0 || loadingArticles) && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Artigos Recentes</h3>

              {loadingArticles ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : recentArticles.length > 0 ? (
                <div className="space-y-4">
                  {recentArticles.map((article) => (
                    <div key={article.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                      <Link href={`/artigos/${article.slug}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700 -m-4 p-4 rounded-lg transition-colors">
                        <h4 className="text-md font-medium text-indigo-600 dark:text-indigo-400 mb-1">{article.title}</h4>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(article.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                          {article.summary || article.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'}
                        </p>
                        <div className="mt-2 flex justify-end">
                          <span className="text-indigo-600 dark:text-indigo-400 text-sm flex items-center">
                            Ler mais <ChevronRight className="w-4 h-4 ml-1" />
                          </span>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                  Este usuário ainda não publicou nenhum artigo.
                </p>
              )}

              {recentArticles.length > 0 && (
                <div className="mt-4 text-center">
                  <Link href={`/artigos?author=${user.slug}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                    Ver todos os artigos
                    <ExternalLink className="ml-1 w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Comentários recentes */}
          {(recentComments.length > 0 || loadingComments) && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comentários Recentes</h3>

              {loadingComments ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : recentComments.length > 0 ? (
                <div className="space-y-4">
                  {recentComments.map((comment) => (
                    <div key={comment.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                      <div className="flex items-start">
                        <div className="flex-1">
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{comment.text}</p>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                            {comment.article && (
                              <>
                                <span className="mx-2">•</span>
                                <Link href={`/artigos/${comment.article.slug}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                  {comment.article.title}
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                  Este usuário ainda não fez nenhum comentário.
                </p>
              )}

              {recentComments.length > 0 && (
                <div className="mt-4 text-center">
                  <Link href={`/comentarios?user=${user.slug}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                    Ver todos os comentários
                    <ExternalLink className="ml-1 w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Usuário não encontrado</h3>
          <p className="text-gray-600 dark:text-gray-400">
            O usuário que você está procurando não existe ou foi removido.
          </p>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Confirmar exclusão
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja excluir o usuário <strong>{user?.username}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
