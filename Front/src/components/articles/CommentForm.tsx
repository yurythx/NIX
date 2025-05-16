'use client';

import React, { useState, useEffect } from 'react';
import { CommentCreateData } from '../../types/models';
import { articlesService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface CommentFormProps {
  articleId: number;
  articleSlug: string;
  parentId?: number | null;
  onCommentAdded: () => void;
  onCancel?: () => void;
  isReply?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  articleId,
  articleSlug,
  parentId = null,
  onCommentAdded,
  onCancel,
  isReply = false
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState<CommentCreateData>({
    name: '',
    email: '',
    text: '',
    article: articleId,
    article_slug: articleSlug,
    parent: parentId,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmitTime, setLastSubmitTime] = useState<number | null>(null);
  const [honeypot, setHoneypot] = useState<string>(''); // Campo honeypot para detectar bots

  // Preencher o nome e email com os dados do usuário logado, se disponível
  // Verificar configurações de comentários
  const [allowAnonymousComments, setAllowAnonymousComments] = useState(true);

  useEffect(() => {
    // Carregar configurações do localStorage
    try {
      const settings = localStorage.getItem('comment_settings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setAllowAnonymousComments(parsedSettings.allowAnonymousComments !== false);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de comentários:', error);
    }
  }, []);

  useEffect(() => {
    // Garantir que o parentId seja definido corretamente no formData
    setFormData(prev => ({
      ...prev,
      parent: parentId
    }));

    console.log(`CommentForm inicializado com parentId: ${parentId}`);

    if (user) {
      const userName = `${user.first_name} ${user.last_name}`.trim() || user.username;
      setFormData(prev => ({
        ...prev,
        name: userName,
        email: user.email || '',
        parent: parentId // Garantir que o parentId seja mantido
      }));
    } else {
      // Se não estiver logado, definir um nome padrão para visitantes
      // Apenas se o nome estiver vazio (para não sobrescrever se o usuário já digitou algo)
      if (!formData.name) {
        setFormData(prev => ({
          ...prev,
          name: 'Visitante',
          parent: parentId // Garantir que o parentId seja mantido
        }));
      }
    }
  }, [user, formData.name, parentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Se for o campo honeypot, atualizamos seu estado separadamente
    if (name === 'website') {
      setHoneypot(value);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar se o campo honeypot foi preenchido (indicando um bot)
    if (honeypot) {
      // Simular sucesso para o bot, mas não fazer nada
      console.log('Possível spam detectado');
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        // Fingir que deu certo para o bot
        setFormData(prev => ({ ...prev, text: '' }));
      }, 1000);
      return;
    }

    // Verificar se os campos obrigatórios estão preenchidos
    if (!formData.name.trim() || !formData.text.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    // Verificar se o texto é muito curto (menos de 3 caracteres)
    if (formData.text.trim().length < 3) {
      setError('O comentário é muito curto. Por favor, escreva um comentário mais detalhado.');
      return;
    }

    // Verificar se o texto é muito longo (mais de 1000 caracteres)
    if (formData.text.trim().length > 1000) {
      setError('O comentário é muito longo. Por favor, limite seu comentário a 1000 caracteres.');
      return;
    }

    // Verificar limite de tempo entre comentários (30 segundos)
    const now = Date.now();
    if (lastSubmitTime && now - lastSubmitTime < 30000) {
      setError('Por favor, aguarde 30 segundos antes de enviar outro comentário.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Log para debug
      console.log('Enviando comentário com dados:', formData);

      // Garantir que o nome não esteja vazio
      const dataToSend = {
        ...formData,
        name: formData.name.trim() || 'Visitante'
      };

      const comment = await articlesService.createComment(dataToSend);
      console.log('Resposta do servidor:', comment);

      // Registrar o momento do envio
      setLastSubmitTime(Date.now());

      // Limpar apenas o texto, mantendo o nome
      setFormData(prev => ({
        ...prev,
        text: '',
      }));

      // Mostrar notificação de sucesso
      showNotification(
        'success',
        isReply ? 'Resposta adicionada com sucesso!' : 'Comentário adicionado com sucesso!'
      );

      // Notificar que o comentário foi adicionado
      onCommentAdded();

      // Fechar o formulário de resposta se for uma resposta
      if (isReply && onCancel) {
        onCancel();
      }
    } catch (err: any) {
      console.error('Erro ao adicionar comentário:', err);
      let errorMessage = 'Ocorreu um erro ao adicionar o comentário. Por favor, tente novamente.';

      if (err.data) {
        // Formatar mensagens de erro
        errorMessage = Object.entries(err.data)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
      }

      setError(errorMessage);
      showNotification('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verificar se o usuário pode comentar
  if (!user && !allowAnonymousComments) {
    return (
      <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded-lg shadow-sm">
        <p className="font-medium">É necessário estar logado para comentar.</p>
        <p className="text-sm mt-1">Por favor, faça login para deixar um comentário.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${isReply ? 'bg-gray-100 dark:bg-gray-750' : ''} p-4 rounded-lg`}>
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg shadow-sm">
          {error}
        </div>
      )}

      {!isReply && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
          <p>Seu endereço de e-mail não será publicado. Os campos obrigatórios estão marcados com *</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`name-${parentId || 'main'}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id={`name-${parentId || 'main'}`}
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor={`email-${parentId || 'main'}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            E-mail <span className="text-xs text-gray-500">(não será publicado)</span>
          </label>
          <input
            type="email"
            id={`email-${parentId || 'main'}`}
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            placeholder="seu@email.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`text-${parentId || 'main'}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Comentário <span className="text-red-500">*</span>
        </label>
        <textarea
          id={`text-${parentId || 'main'}`}
          name="text"
          value={formData.text}
          onChange={handleChange}
          required
          rows={isReply ? 3 : 4}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
          placeholder="Digite seu comentário"
          maxLength={1000}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {formData.text.length}/1000 caracteres
        </p>
      </div>

      {/* Campo honeypot - invisível para usuários, mas bots tentarão preenchê-lo */}
      <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
        <label htmlFor="website">Website (não preencha este campo)</label>
        <input
          type="text"
          id="website"
          name="website"
          value={honeypot}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="mb-3 sm:mb-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <span className="text-red-500 mr-1">*</span> Campos obrigatórios
          </p>
        </div>

        <div className="flex space-x-2 w-full sm:w-auto">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex-grow sm:flex-grow-0"
          >
            {isSubmitting ? 'Enviando...' : isReply ? 'Responder' : 'Enviar Comentário'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
