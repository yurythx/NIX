'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import * as usersService from '../../services/api/users.service';
import { User } from '../../types/models';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function UsersPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const itemsPerPage = 10;

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Carregar usuários
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await usersService.getUsers();
        setUsers(data);
        setTotalPages(Math.ceil(data.length / itemsPerPage));
      } catch (err: any) {
        console.error('Erro ao carregar usuários:', err);
        setError(err.message || 'Erro ao carregar usuários');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, refreshTrigger]);

  // Filtrar usuários com base no termo de pesquisa
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.position && user.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Paginação
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Função para excluir usuário
  const deleteUser = async (slug: string) => {
    try {
      setIsDeleting(slug);
      await usersService.deleteUser(slug);
      setShowDeleteConfirm(null);
      setRefreshTrigger(prev => prev + 1);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao excluir usuário:', err);
      setError(err.message || 'Erro ao excluir usuário');
    } finally {
      setIsDeleting(null);
    }
  };

  // Verificar se o usuário atual é administrador
  const isAdmin = user?.is_staff || user?.is_superuser;

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciamento de Usuários</h1>

        {isAdmin && (
          <Link
            href="/usuarios/novo"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Usuário
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <div>
            <p className="font-medium">{error}</p>
            <p className="text-sm mt-1">
              Usando dados simulados para demonstração. Algumas funcionalidades podem estar limitadas.
            </p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-700 hover:text-red-900"
            title="Fechar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md"
              title="Atualizar lista"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md"
              title="Filtrar"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={user.avatar}
                              alt={user.username}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : user.username}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.position || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center space-x-2">
                        <Link
                          href={`/usuarios/${user.slug}`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Ver detalhes"
                        >
                          <UserIcon className="w-5 h-5" />
                        </Link>

                        {isAdmin && (
                          <>
                            <Link
                              href={`/usuarios/${user.slug}/editar`}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Editar"
                            >
                              <Edit className="w-5 h-5" />
                            </Link>

                            <button
                              onClick={() => setShowDeleteConfirm(user.slug)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Excluir"
                              disabled={isDeleting === user.slug}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {filteredUsers.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                  </span>{' '}
                  de <span className="font-medium">{filteredUsers.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                      currentPage === 1
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-indigo-50 dark:bg-indigo-900 border-indigo-500 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                      currentPage === totalPages
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirmar exclusão</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={() => showDeleteConfirm && deleteUser(showDeleteConfirm)}
                disabled={isDeleting !== null}
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
