'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types/models';
import * as usersService from '../../services/api/users.service';
import { Camera, Save, User as UserIcon, Settings, Palette } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<User>>({
    first_name: '',
    last_name: '',
    bio: '',
    position: '',
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
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || '',
        position: user.position || '',
      });

      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      const updateData: Partial<User> = {
        ...formData,
      };

      if (avatar) {
        updateData.avatar = avatar;
      }

      console.log('Enviando dados para atualização:', updateData);

      // Usar o método updateProfile para atualizar o perfil do usuário atual
      const updatedUser = await usersService.updateProfile(updateData);
      console.log('Perfil atualizado com sucesso:', updatedUser);

      // Atualizar o usuário no contexto de autenticação
      await refreshUser();

      // Limpar o avatar após o upload bem-sucedido
      setAvatar(null);

      // Mostrar mensagem de sucesso
      setSuccess('Perfil atualizado com sucesso!');

      // Atualizar o formulário com os dados atualizados
      setFormData({
        first_name: updatedUser.first_name || '',
        last_name: updatedUser.last_name || '',
        bio: updatedUser.bio || '',
        position: updatedUser.position || '',
      });

      // Atualizar o preview do avatar se disponível
      if (updatedUser.avatar) {
        setAvatarPreview(updatedUser.avatar);
      }
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);

      // Verificar se o erro é um ApiError
      if (err.isApiError) {
        if (err.data) {
          // Formatar mensagens de erro
          const errorMessages = Object.entries(err.data)
            .filter(([key, value]) => key !== 'detail' && value !== undefined)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');

          if (errorMessages) {
            setError(errorMessages);
          } else if (err.message) {
            setError(err.message);
          } else {
            setError('Ocorreu um erro ao atualizar o perfil. Por favor, tente novamente.');
          }
        } else {
          setError(err.message || 'Ocorreu um erro ao atualizar o perfil. Por favor, tente novamente.');
        }
      } else {
        // Erro genérico
        setError('Ocorreu um erro ao atualizar o perfil. Por favor, tente novamente.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Seu Perfil</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/perfil/aparencia"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow flex flex-col items-center text-center"
        >
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full mb-4">
            <Palette className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aparência</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Personalize o tema, cores e modo de exibição da plataforma.
          </p>
        </Link>

        <Link
          href="/perfil/notificacoes"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow flex flex-col items-center text-center"
        >
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full mb-4">
            <Settings className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Notificações</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Configure suas preferências de notificações e alertas.
          </p>
        </Link>

        <Link
          href="/perfil/seguranca"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow flex flex-col items-center text-center"
        >
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full mb-4">
            <Settings className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Segurança</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Gerencie sua senha e configurações de segurança da conta.
          </p>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user.username}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nome
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sobrenome
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Cargo/Posição
          </label>
          <input
            type="text"
            id="position"
            name="position"
            value={formData.position || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Biografia
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio || ''}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
