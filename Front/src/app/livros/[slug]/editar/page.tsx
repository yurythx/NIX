'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Book, Upload, Headphones } from 'lucide-react';
import Link from 'next/link';
import { getBookBySlug, updateBook } from '../../../../services/api/books.service';
import { getCategories } from '../../../../utils/categoryFallback';
import { useNotification } from '../../../../contexts/NotificationContext';
import { useAuth } from '../../../../contexts/AuthContext';

export default function EditBookPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    has_audio: false
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Verificar autenticação
  useEffect(() => {
    if (!isAuthenticated) {
      showNotification('error', 'Você precisa estar autenticado para editar um livro');
      router.push('/login');
    } else {
      // Permitir que qualquer usuário autenticado possa editar livros
      console.log('Usuário autenticado:', user);
    }
  }, [isAuthenticated, user, router, showNotification]);

  // Buscar dados do livro e categorias
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Buscar livro e categorias em paralelo
        const [bookData, categoriesData] = await Promise.all([
          getBookBySlug(slug as string),
          getCategories()
        ]);

        if (!bookData) {
          showNotification('error', 'Livro não encontrado');
          router.push('/livros');
          return;
        }

        // Preencher formulário com dados do livro
        setFormData({
          title: bookData.title,
          description: bookData.description,
          category: bookData.category ? bookData.category.toString() : '',
          has_audio: bookData.has_audio
        });

        // Definir preview da capa se existir
        if (bookData.cover) {
          setCoverPreview(bookData.cover);
        }

        // Armazenar categorias
        setCategories(categoriesData);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        showNotification('error', 'Erro ao carregar dados do livro');
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug, router, showNotification]);

  // Manipular mudanças nos campos do formulário
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Limpar erro do campo quando o usuário digitar
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Manipular upload de capa
  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);

      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Limpar erro
      if (errors.cover) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.cover;
          return newErrors;
        });
      }
    }
  };

  // Manipular upload de áudio
  const handleAudioChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);

      // Limpar erro
      if (errors.audio_file) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.audio_file;
          return newErrors;
        });
      }
    }
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'O título é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'A descrição é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulário
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showNotification('error', 'Por favor, corrija os erros no formulário');
      return;
    }

    try {
      setIsSubmitting(true);

      const bookData = {
        title: formData.title,
        description: formData.description,
        has_audio: formData.has_audio,
        cover: coverFile,
        audio_file: audioFile,
        category: formData.category ? parseInt(formData.category) : undefined
      };

      const updatedBook = await updateBook(slug as string, bookData);
      showNotification('success', 'Livro atualizado com sucesso!');
      router.push(`/livros/${updatedBook.slug}`);
    } catch (error: any) {
      console.error('Erro ao atualizar livro:', error);
      showNotification('error', error.message || 'Erro ao atualizar livro. Tente novamente mais tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/livros/${slug}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para o livro
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Book className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
          Editar Livro
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.title ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Digite o título do livro"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.description ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Digite a descrição do livro"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
            )}
          </div>

          {/* Categoria */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoria
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Capa */}
          <div>
            <label htmlFor="cover" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Capa
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer bg-indigo-50 dark:bg-indigo-900/20 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg p-4 flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 text-indigo-500 dark:text-indigo-400 mb-2" />
                <span className="text-sm text-indigo-600 dark:text-indigo-400">
                  {coverPreview ? 'Alterar imagem' : 'Adicionar imagem'}
                </span>
                <input
                  type="file"
                  id="cover"
                  name="cover"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>

              {coverPreview && (
                <div className="relative w-24 h-32 overflow-hidden rounded-lg">
                  <img
                    src={coverPreview}
                    alt="Preview da capa"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview(null);
                    }}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tem áudio */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="has_audio"
              name="has_audio"
              checked={formData.has_audio}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="has_audio" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tem áudio
            </label>
          </div>

          {/* Arquivo de áudio (condicional) */}
          {formData.has_audio && (
            <div>
              <label htmlFor="audio_file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Arquivo de áudio
              </label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-4 flex flex-col items-center justify-center">
                  <Headphones className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-2" />
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    {audioFile ? 'Alterar áudio' : 'Adicionar áudio'}
                  </span>
                  <input
                    type="file"
                    id="audio_file"
                    name="audio_file"
                    accept="audio/*"
                    onChange={handleAudioChange}
                    className="hidden"
                  />
                </label>

                {audioFile && (
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                    <Headphones className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm text-blue-600 dark:text-blue-400 truncate max-w-xs">
                      {audioFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAudioFile(null)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4">
            <Link
              href={`/livros/${slug}`}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
