'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import mangasService from '../../../../services/api/mangas.service';
import { useAuth } from '../../../../contexts/AuthContext';
import { useNotification } from '../../../../contexts/NotificationContext';

export default function EditarMangaPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [currentCover, setCurrentCover] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    cover?: string;
  }>({});

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/mangas/${params.slug}/editar`);
    }
  }, [isAuthenticated, router, params.slug]);

  // Carregar dados do mangá
  useEffect(() => {
    const fetchManga = async () => {
      try {
        setIsLoading(true);
        const manga = await mangasService.getMangaBySlug(params.slug);

        if (!manga) {
          showNotification('Mangá não encontrado', 'error');
          router.push('/mangas');
          return;
        }

        setFormData({
          title: manga.title,
          description: manga.description || '',
        });

        if (manga.cover) {
          setCurrentCover(manga.cover);
          setCoverPreview(manga.cover);
        }
      } catch (error) {
        console.error('Erro ao carregar mangá:', error);
        showNotification('Erro ao carregar dados do mangá', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchManga();
    }
  }, [isAuthenticated, params.slug, router, showNotification]);

  const validateForm = (): boolean => {
    const newErrors: {
      title?: string;
      description?: string;
      cover?: string;
    } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'O título é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'A descrição é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          cover: 'O arquivo deve ser uma imagem'
        }));
        return;
      }

      // Validar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          cover: 'A imagem deve ter no máximo 5MB'
        }));
        return;
      }

      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      setErrors(prev => ({
        ...prev,
        cover: undefined
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const mangaData: {
        title: string;
        description: string;
        cover?: File;
      } = {
        title: formData.title,
        description: formData.description,
      };

      // Só incluir a capa se uma nova foi selecionada
      if (coverFile) {
        mangaData.cover = coverFile;
      }

      await mangasService.updateManga(params.slug, mangaData);

      showNotification('Mangá atualizado com sucesso!', 'success');
      router.push(`/mangas/${params.slug}`);
    } catch (error) {
      console.error('Erro ao atualizar mangá:', error);
      showNotification('Erro ao atualizar mangá. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/mangas/${params.slug}`} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1">
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Editar Mangá</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Título do mangá"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Descrição do mangá"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
              )}
            </div>

            <div>
              <label htmlFor="cover" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Capa
              </label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    errors.cover ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    <input
                      type="file"
                      id="cover"
                      name="cover"
                      onChange={handleCoverChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <label
                      htmlFor="cover"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {currentCover ? 'Clique para alterar a imagem' : 'Clique para selecionar uma imagem'}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        PNG, JPG ou WEBP (máx. 5MB)
                      </span>
                    </label>
                  </div>
                  {errors.cover && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cover}</p>
                  )}
                </div>

                {coverPreview && (
                  <div className="w-32 h-44 relative bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={coverPreview}
                      alt="Pré-visualização da capa"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <Save className="w-5 h-5" />
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
