'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import * as usersService from '../../../../services/api/users.service';
import { UserDetail } from '../../../../types/models';
import {
  User as UserIcon,
  Save,
  ArrowLeft,
  Camera,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import Link from 'next/link';

interface UserEditPageProps {
  params: {
    slug: string;
  };
}

export default function UserEditPage({ params }: UserEditPageProps) {
  const { slug } = params;
  const router = useRouter();
  const { isAuthenticated, user: currentUser, refreshUser } = useAuth();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    bio: '',
    position: '',
    is_active: true,
    is_staff: false,
  });

  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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

        // Preencher o formulário com os dados do usuário
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          username: data.username || '',
          bio: data.bio || '',
          position: data.position || '',
          is_active: data.is_active !== undefined ? data.is_active : true,
          is_staff: data.is_staff !== undefined ? data.is_staff : false,
        });

        if (data.avatar) {
          setAvatarPreview(data.avatar);
        }
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

  // Verificar se o usuário atual é administrador
  const isAdmin = currentUser?.is_staff || currentUser?.is_superuser;

  // Verificar se o usuário atual é o próprio usuário ou um administrador
  const canEdit = isAdmin || currentUser?.slug === slug;

  // Redirecionar se não tiver permissão para editar
  useEffect(() => {
    if (!isLoading && !canEdit) {
      router.push(`/usuarios/${slug}`);
    }
  }, [canEdit, isLoading, router, slug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAvatar(file);

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      if (!user) return;

      // Incluir avatar no formData se existir
      const updateData: Partial<UserDetail> = {
        ...formData,
      };

      if (avatar) {
        updateData.avatar = avatar;
      }

      // Atualizar o usuário
      await usersService.updateUser(slug, updateData);

      // Se o usuário atual estiver editando seu próprio perfil, atualizar os dados no contexto
      if (currentUser?.slug === slug) {
        await refreshUser();
      }

      setSuccess('Usuário atualizado com sucesso!');

      // Redirecionar após um breve delay
      setTimeout(() => {
        router.push(`/usuarios/${slug}`);
      }, 2000);
    } catch (err: any) {
      console.error('Erro ao atualizar usuário:', err);
      if (err.data) {
        // Formatar mensagens de erro
        const errorMessages = Object.entries(err.data)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
        setError(errorMessages);
      } else {
        setError(err.message || 'Ocorreu um erro ao atualizar o usuário. Por favor, tente novamente.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated || !canEdit) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href={`/usuarios/${slug}`} className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Editar Usuário</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-32 h-32 mb-4">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover border-4 border-indigo-200 dark:border-indigo-900"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <UserIcon className="w-16 h-16 text-indigo-500 dark:text-indigo-300" />
                  </div>
                )}
                <label
                  htmlFor="avatar"
                  className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition"
                >
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    id="avatar"
                    name="avatar"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sobrenome
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome de usuário
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cargo/Posição
              </label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Biografia
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {isAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Usuário ativo
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_staff"
                    name="is_staff"
                    checked={formData.is_staff}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_staff" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Membro da equipe
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50 dark:bg-gray-700 flex justify-end">
            <Link
              href={`/usuarios/${slug}`}
              className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 mr-3"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
