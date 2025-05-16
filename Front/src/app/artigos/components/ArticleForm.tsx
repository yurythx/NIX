'use client';

import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Article, ArticleCreateData, ArticleUpdateData, Category } from '../../../types/models';
import { useRouter } from 'next/navigation';
import * as articlesService from '../../../services/api/articles.service';
import { getCategories, DEFAULT_CATEGORIES } from '../../../utils/categoryFallback';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { Image, Upload } from 'lucide-react';

// Lazy load do editor de texto rico para melhorar a performance
const RichTextEditor = lazy(() => import('../../../components/ui/RichTextEditor'));

interface ArticleFormProps {
  article?: Article;
  onSuccess?: () => void;
}

export default function ArticleForm({ article, onSuccess }: ArticleFormProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(article?.title || '');
  const [content, setContent] = useState(article?.content || '');
  const [categoryId, setCategoryId] = useState<number | undefined>(article?.category_id);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(article?.cover_image || null);
  const [featured, setFeatured] = useState<boolean>(article?.featured || false);

  const isEditing = !!article;

  useEffect(() => {
    // Redirecionar se não estiver autenticado
    if (!isAuthenticated) {
      router.push('/login?redirect=/artigos/novo');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Atualizar campos quando o artigo mudar
    if (article) {
      setTitle(article.title);
      setContent(article.content);
      setCategoryId(article.category_id);
      setFeatured(article.featured || false);
      setCoverImagePreview(article.cover_image || null);
    }
  }, [article]);

  // Função para lidar com o upload de imagens
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar o tipo do arquivo
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    // Verificar o tamanho do arquivo (limite de 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'A imagem deve ter no máximo 5MB.');
      return;
    }

    setCoverImage(file);

    // Criar uma URL para preview da imagem
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Função para remover a imagem
  const handleRemoveImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Carregar categorias
  useEffect(() => {
    // Buscar categorias do backend ou usar as padrão
    const fetchCategories = async () => {
      try {
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        setCategories(DEFAULT_CATEGORIES);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
    // Não colocar setIsLoadingCategories aqui para evitar múltiplas renderizações
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (isEditing && article) {
        // Atualizar artigo existente
        const data: ArticleUpdateData = {
          title: title.trim(),
          content: content.trim(),
          category_id: categoryId,
          featured: featured
        };

        // Adicionar imagem de capa se houver
        if (coverImage) {
          data.cover_image = coverImage;
        }

        const updatedArticle = await articlesService.updateArticle(article.slug, data);

        showNotification('success', 'Artigo atualizado com sucesso!');

        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/artigos/${updatedArticle.slug}`);
        }
      } else {
        // Criar novo artigo
        const data: ArticleCreateData = {
          title: title.trim(),
          content: content.trim(),
          category_id: categoryId,
          featured: featured
        };

        // Adicionar imagem de capa se houver
        if (coverImage) {
          data.cover_image = coverImage;
        }

        const newArticle = await articlesService.createArticle(data);

        showNotification('success', 'Artigo criado com sucesso!');

        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/artigos/${newArticle.slug}`);
        }
      }
    } catch (err: any) {
      console.error('Erro ao salvar artigo:', err);
      const errorMessage = err.message || 'Ocorreu um erro ao salvar o artigo. Por favor, tente novamente.';
      setError(errorMessage);
      showNotification('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Título
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          placeholder="Digite o título do artigo"
          required
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Conteúdo
        </label>
        <Suspense fallback={
          <div className="w-full h-[400px] bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        }>
          <RichTextEditor
            value={content}
            onChange={setContent}
            height={400}
            placeholder="Digite o conteúdo do artigo..."
          />
        </Suspense>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Categoria
        </label>
        <select
          id="category"
          value={categoryId || ''}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="">Selecione uma categoria</option>
          {isLoadingCategories ? (
            <option disabled>Carregando categorias...</option>
          ) : (
            categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Campo de upload de imagem */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Imagem de Capa
        </label>

        {coverImagePreview ? (
          <div className="relative mb-4">
            <img
              src={coverImagePreview}
              alt="Preview"
              className="w-full max-h-64 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              title="Remover imagem"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Clique para fazer upload de uma imagem
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              PNG, JPG, GIF até 5MB
            </p>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* Campo de destaque */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="featured"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="featured" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Destacar este artigo
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Publicar'}
        </button>
      </div>
    </form>
  );
}
