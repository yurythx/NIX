'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { UserCreateData } from '../../types/models';

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { register, isLoading } = useAuth();
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState<UserCreateData>({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    bio: '',
    position: '',
  });
  const [avatar, setAvatar] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAvatar(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar senhas
    if (formData.password !== formData.password_confirm) {
      showNotification('error', 'As senhas não conferem.');
      return;
    }

    // Validar campos obrigatórios
    if (!formData.username || !formData.email || !formData.password) {
      showNotification('error', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      // Incluir avatar no formData se existir
      const registerData: UserCreateData = {
        ...formData,
        avatar: avatar,
      };

      console.log('Enviando dados de registro:', { ...registerData, password: '***', password_confirm: '***' });

      await register(registerData);
      showNotification('success', 'Conta criada com sucesso!');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Erro ao registrar:', err);

      // Tratamento detalhado de erros
      if (err.data) {
        // Mostrar erros como notificações
        Object.entries(err.data).forEach(([field, messages]) => {
          const messageStr = Array.isArray(messages) ? messages.join(', ') : String(messages);
          showNotification('error', `${field}: ${messageStr}`);
        });
      } else if (err.message) {
        showNotification('error', err.message);
      } else {
        showNotification('error', 'Ocorreu um erro ao registrar. Por favor, tente novamente.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nome de usuário*
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            autoComplete="username"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email*
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            autoComplete="given-name"
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
            autoComplete="family-name"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Senha*
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="new-password"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
        />

      </div>

      <div>
        <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Confirmar Senha*
        </label>
        <input
          type="password"
          id="password_confirm"
          name="password_confirm"
          value={formData.password_confirm}
          onChange={handleChange}
          required
          autoComplete="new-password"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
        />

      </div>

      <div>
        <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Avatar
        </label>
        <input
          type="file"
          id="avatar"
          name="avatar"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
        />
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
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Registrando...' : 'Registrar'}
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;
