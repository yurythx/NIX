'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Book, Upload, Headphones } from 'lucide-react';
import Link from 'next/link';
import booksService from '../../../services/api/books.service';
import chunkedUploadService from '../../../services/api/books.chunked-upload.service';
import { getCategories } from '../../../utils/categoryFallback';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import PageTransition from '../../../components/ui/PageTransition';

export default function NewBookPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    has_audio: false
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState({
    pdf: 0,
    audio: 0
  });

  // Verificar autenticação
  useEffect(() => {
    // Aguardar até que a verificação de autenticação seja concluída
    if (!isLoading) {
      console.log('Estado de autenticação:', { isAuthenticated, user, isLoading });

      if (!isAuthenticated) {
        console.log('Usuário não autenticado, redirecionando para login');
        showNotification('error', 'Você precisa estar autenticado para criar um livro');
        router.push('/login');
      } else {
        // Permitir que qualquer usuário autenticado possa adicionar livros
        console.log('Usuário autenticado:', user);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, user]);

  // Buscar categorias
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        // Usar uma referência estável para showNotification
        if (error instanceof Error) {
          showNotification('error', `Erro ao carregar categorias: ${error.message}`);
        } else {
          showNotification('error', 'Erro ao carregar categorias');
        }
      }
    };

    fetchCategories();
    // Remover showNotification das dependências para evitar loop infinito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Manipular upload de PDF
  const handlePdfChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Verificar tipo de arquivo
      if (file.type !== 'application/pdf') {
        setErrors(prev => ({
          ...prev,
          pdf_file: 'O arquivo deve ser um PDF'
        }));
        return;
      }

      // Verificar tamanho (200MB)
      if (file.size > 200 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          pdf_file: 'O arquivo PDF não pode ter mais de 200MB'
        }));
        return;
      }

      setPdfFile(file);

      // Limpar erro
      if (errors.pdf_file) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.pdf_file;
          return newErrors;
        });
      }
    }
  };

  // Manipular upload de áudio
  const handleAudioChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Verificar tipo de arquivo
      if (!file.type.startsWith('audio/')) {
        setErrors(prev => ({
          ...prev,
          audio_file: 'O arquivo deve ser um áudio'
        }));
        return;
      }

      // Verificar tamanho (200MB)
      if (file.size > 200 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          audio_file: 'O arquivo de áudio não pode ter mais de 200MB'
        }));
        return;
      }

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

    if (!pdfFile) {
      newErrors.pdf_file = 'O arquivo PDF é obrigatório';
    }

    if (formData.has_audio && !audioFile) {
      newErrors.audio_file = 'O arquivo de áudio é obrigatório quando "Tem áudio" está marcado';
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

    // Verificar se os arquivos necessários foram selecionados
    if (!coverFile) {
      setErrors(prev => ({ ...prev, cover: 'A capa é obrigatória' }));
      showNotification('error', 'Por favor, selecione uma imagem de capa');
      return;
    }

    if (!pdfFile) {
      setErrors(prev => ({ ...prev, pdf_file: 'O arquivo PDF é obrigatório' }));
      showNotification('error', 'Por favor, selecione um arquivo PDF');
      return;
    }

    if (formData.has_audio && !audioFile) {
      setErrors(prev => ({ ...prev, audio_file: 'O arquivo de áudio é obrigatório quando "Tem áudio" está marcado' }));
      showNotification('error', 'Por favor, selecione um arquivo de áudio');
      return;
    }

    try {
      setIsSubmitting(true);

      let pdfFilePath = '';
      let audioFilePath = '';

      // Upload do PDF em chunks
      if (pdfFile) {
        try {
          setUploadProgress(prev => ({ ...prev, pdf: 1 })); // Iniciar progresso

          const pdfResult = await chunkedUploadService.uploadPdfInChunks(
            pdfFile,
            (progress) => {
              setUploadProgress(prev => ({ ...prev, pdf: progress }));
            }
          );

          pdfFilePath = pdfResult.filePath;
          console.log('Upload de PDF concluído:', pdfResult);

          setUploadProgress(prev => ({ ...prev, pdf: 100 })); // Finalizar progresso
        } catch (uploadError) {
          console.error('Erro no upload do PDF:', uploadError);
          showNotification('error', 'Erro ao fazer upload do PDF. Tente novamente.');
          setIsSubmitting(false);
          return;
        }
      }

      // Upload do áudio em chunks (se necessário)
      if (formData.has_audio && audioFile) {
        try {
          setUploadProgress(prev => ({ ...prev, audio: 1 })); // Iniciar progresso

          const audioResult = await chunkedUploadService.uploadAudioInChunks(
            audioFile,
            (progress) => {
              setUploadProgress(prev => ({ ...prev, audio: progress }));
            }
          );

          audioFilePath = audioResult.filePath;
          console.log('Upload de áudio concluído:', audioResult);

          setUploadProgress(prev => ({ ...prev, audio: 100 })); // Finalizar progresso
        } catch (uploadError) {
          console.error('Erro no upload do áudio:', uploadError);
          showNotification('error', 'Erro ao fazer upload do áudio. Tente novamente.');
          setIsSubmitting(false);
          return;
        }
      }

      // Criar o livro com os caminhos dos arquivos
      const bookData = {
        title: formData.title,
        description: formData.description,
        has_audio: formData.has_audio,
        cover: coverFile,
        pdf_file_path: pdfFilePath,
        audio_file_path: formData.has_audio ? audioFilePath : undefined,
        category: formData.category ? parseInt(formData.category) : undefined
      };

      const newBook = await booksService.createBook(bookData);
      showNotification('success', 'Livro criado com sucesso!');
      router.push(`/livros/${newBook.slug}`);
    } catch (error: any) {
      console.error('Erro ao criar livro:', error);
      showNotification('error', error.message || 'Erro ao criar livro. Tente novamente mais tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/livros" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a lista de livros
          </Link>
        </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Book className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
          Adicionar Novo Livro
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Capa
            </label>
            <div className="flex items-center gap-4">
              {coverPreview ? (
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
              ) : (
                <div className="flex flex-col gap-2">
                  <label htmlFor="cover_image" className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-indigo-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:hover:border-indigo-400">
                    <span className="flex items-center space-x-2">
                      <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        Selecionar capa (máx. 5MB)
                      </span>
                    </span>
                    <input
                      type="file"
                      id="cover_image"
                      name="cover_image"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];

                          // Verificar tamanho (5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            setErrors(prev => ({
                              ...prev,
                              cover: 'A imagem não pode ter mais de 5MB'
                            }));
                            return;
                          }

                          // Criar preview
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setCoverPreview(event.target?.result as string);
                          };
                          reader.readAsDataURL(file);

                          // Salvar arquivo
                          setCoverFile(file);

                          // Limpar erro
                          if (errors.cover) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.cover;
                              return newErrors;
                            });
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
            {errors.cover && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cover}</p>
            )}
          </div>

          {/* Arquivo PDF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Arquivo PDF *
            </label>
            <div className="flex items-center gap-4">
              {pdfFile ? (
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                  <Book className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  <span className="text-sm text-blue-600 dark:text-blue-400 truncate max-w-xs">
                    {pdfFile.name} ({(pdfFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setPdfFile(null)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label htmlFor="pdf_file" className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-indigo-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:hover:border-indigo-400">
                    <span className="flex items-center space-x-2">
                      <Book className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        Selecionar arquivo PDF (máx. 200MB)
                      </span>
                    </span>
                    <input
                      type="file"
                      id="pdf_file"
                      name="pdf_file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handlePdfChange}
                    />
                  </label>
                </div>
              )}
            </div>
            {errors.pdf_file && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pdf_file}</p>
            )}
            {uploadProgress.pdf > 0 && uploadProgress.pdf < 100 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress.pdf}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enviando: {uploadProgress.pdf}%
                </p>
              </div>
            )}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Arquivo de áudio *
              </label>
              <div className="flex items-center gap-4">
                {audioFile ? (
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
                ) : (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="audio_file" className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-indigo-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:hover:border-indigo-400">
                      <span className="flex items-center space-x-2">
                        <Headphones className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-medium text-gray-600 dark:text-gray-300">
                          Selecionar arquivo de áudio (máx. 200MB)
                        </span>
                      </span>
                      <input
                        type="file"
                        id="audio_file"
                        name="audio_file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];

                            // Verificar tamanho (200MB)
                            if (file.size > 200 * 1024 * 1024) {
                              setErrors(prev => ({
                                ...prev,
                                audio_file: 'O arquivo de áudio não pode ter mais de 200MB'
                              }));
                              return;
                            }

                            // Salvar arquivo
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
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
              {errors.audio_file && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.audio_file}</p>
              )}
              {uploadProgress.audio > 0 && uploadProgress.audio < 100 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress.audio}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enviando: {uploadProgress.audio}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4">
            <Link
              href="/livros"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Livro'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </PageTransition>
  );
}
