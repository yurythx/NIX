'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { ArrowLeft, Upload, Save, Plus, Trash } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import mangasService from '../../../../../services/api/mangas.service';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useNotification } from '../../../../../contexts/NotificationContext';

export default function NovoCapituloPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<'chapter' | 'pages'>('chapter');
  const [manga, setManga] = useState<{ id: number; title: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    number: 1,
    chapter_type: 'images' as 'images' | 'pdf',
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pages, setPages] = useState<{ file: File; preview: string }[]>([]);
  const [errors, setErrors] = useState<{
    title?: string;
    number?: string;
    pages?: string;
    pdf_file?: string;
  }>({});

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/mangas/${params.slug}/chapters/novo`);
    }
  }, [isAuthenticated, router, params.slug]);

  // Carregar dados do mangá
  useEffect(() => {
    const fetchManga = async () => {
      try {
        setIsLoading(true);
        const mangaData = await mangasService.getMangaBySlug(params.slug);

        if (!mangaData) {
          showNotification('Mangá não encontrado', 'error');
          router.push('/mangas');
          return;
        }

        setManga({
          id: mangaData.id,
          title: mangaData.title
        });

        // Definir o número do próximo capítulo
        if (mangaData.chapters && mangaData.chapters.length > 0) {
          const maxChapterNumber = Math.max(...mangaData.chapters.map(c => c.number));
          setFormData(prev => ({
            ...prev,
            number: maxChapterNumber + 1
          }));
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

  // Efeito para monitorar mudanças no tipo de capítulo e no arquivo PDF
  useEffect(() => {
    console.log('Tipo de capítulo alterado para:', formData.chapter_type);

    // Se o tipo for PDF, verificar se há um arquivo PDF selecionado
    if (formData.chapter_type === 'pdf') {
      console.log('Estado atual do PDF:', pdfFile ? `${pdfFile.name} (${pdfFile.size} bytes)` : 'Nenhum');
    }
  }, [formData.chapter_type, pdfFile]);

  const validateForm = (): boolean => {
    const newErrors: {
      title?: string;
      number?: string;
      pages?: string;
      pdf_file?: string;
    } = {};

    // Validação do título
    if (!formData.title.trim()) {
      newErrors.title = 'O título é obrigatório';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'O título deve ter pelo menos 3 caracteres';
    } else if (formData.title.trim().length > 255) {
      newErrors.title = 'O título deve ter no máximo 255 caracteres';
    }

    // Validação do número do capítulo
    if (!formData.number) {
      newErrors.number = 'O número do capítulo é obrigatório';
    } else if (formData.number < 1) {
      newErrors.number = 'O número do capítulo deve ser maior que zero';
    } else if (formData.number > 9999) {
      newErrors.number = 'O número do capítulo deve ser menor que 10000';
    }

    // Validação baseada no tipo de capítulo
    if (formData.chapter_type === 'images') {
      // Validação das páginas para capítulos de imagens
      if (pages.length === 0) {
        newErrors.pages = 'Adicione pelo menos uma página';
      } else {
        // Verificar se há arquivos muito grandes
        const maxSizeMB = 5; // 5MB
        const maxSizeBytes = maxSizeMB * 1024 * 1024;

        const largeFiles = pages.filter(page => page.file.size > maxSizeBytes);
        if (largeFiles.length > 0) {
          newErrors.pages = `${largeFiles.length} página(s) excedem o tamanho máximo de ${maxSizeMB}MB`;
        }

        // Verificar tipos de arquivo permitidos
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const invalidFiles = pages.filter(page => !allowedTypes.includes(page.file.type));
        if (invalidFiles.length > 0) {
          newErrors.pages = `${invalidFiles.length} página(s) têm formato inválido. Use JPEG, PNG, WebP ou GIF`;
        }
      }
    } else if (formData.chapter_type === 'pdf') {
      // Validação do arquivo PDF para capítulos de PDF
      if (!pdfFile) {
        newErrors.pdf_file = 'Selecione um arquivo PDF';
        // Destacar o erro para o usuário
        showNotification('Por favor, selecione um arquivo PDF', 'error');
      } else {
        // Verificar tamanho do arquivo PDF
        const maxSizeMB = 100; // 100MB
        const maxSizeBytes = maxSizeMB * 1024 * 1024;

        if (pdfFile.size > maxSizeBytes) {
          newErrors.pdf_file = `O arquivo PDF excede o tamanho máximo de ${maxSizeMB}MB`;
          showNotification(`O arquivo PDF excede o tamanho máximo de ${maxSizeMB}MB`, 'error');
        }

        // Verificar tipo de arquivo
        if (pdfFile.type !== 'application/pdf') {
          newErrors.pdf_file = 'O arquivo deve ser um PDF';
          showNotification('O arquivo selecionado não é um PDF válido', 'error');
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'number' ? parseInt(value) || '' : value
    }));
  };

  const handlePageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPages: { file: File; preview: string }[] = [];

      Array.from(e.target.files).forEach(file => {
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          setErrors(prev => ({
            ...prev,
            pages: 'Os arquivos devem ser imagens'
          }));
          return;
        }

        // Validar tamanho do arquivo (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setErrors(prev => ({
            ...prev,
            pages: 'Cada imagem deve ter no máximo 5MB'
          }));
          return;
        }

        newPages.push({
          file,
          preview: URL.createObjectURL(file)
        });
      });

      if (newPages.length > 0) {
        setPages(prev => [...prev, ...newPages]);
        setErrors(prev => ({
          ...prev,
          pages: undefined
        }));
      }
    }
  };

  const handlePdfUpload = (e: ChangeEvent<HTMLInputElement>) => {
    try {
      // Limpar erros anteriores
      setErrors(prev => ({
        ...prev,
        pdf_file: undefined
      }));

      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];

        console.log('Arquivo PDF selecionado:', file.name, file.type, file.size);

        // Validar tipo de arquivo
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
          setErrors(prev => ({
            ...prev,
            pdf_file: 'O arquivo deve ser um PDF'
          }));
          showNotification('O arquivo selecionado não é um PDF válido', 'error');
          return;
        }

        // Validar tamanho do arquivo (máximo 100MB)
        const maxSizeMB = 100;
        if (file.size > maxSizeMB * 1024 * 1024) {
          setErrors(prev => ({
            ...prev,
            pdf_file: `O arquivo PDF deve ter no máximo ${maxSizeMB}MB`
          }));
          showNotification(`O arquivo PDF deve ter no máximo ${maxSizeMB}MB`, 'error');
          return;
        }

        // Atualizar o estado com o arquivo selecionado
        setPdfFile(file);

        // Confirmar que o arquivo foi selecionado
        showNotification(`Arquivo "${file.name}" selecionado com sucesso`, 'success');

        // Verificação adicional para garantir que o arquivo foi definido
        setTimeout(() => {
          console.log('Estado do PDF após seleção:', pdfFile ? 'Definido' : 'Não definido');
        }, 100);
      } else {
        console.log('Nenhum arquivo selecionado');
      }
    } catch (error) {
      console.error('Erro ao processar o arquivo PDF:', error);
      showNotification('Erro ao processar o arquivo PDF', 'error');
    }
  };

  const removePage = (index: number) => {
    setPages(prev => {
      const newPages = [...prev];
      URL.revokeObjectURL(newPages[index].preview);
      newPages.splice(index, 1);
      return newPages;
    });
  };

  const reorderPages = (dragIndex: number, hoverIndex: number) => {
    setPages(prev => {
      const newPages = [...prev];
      const draggedPage = newPages[dragIndex];
      newPages.splice(dragIndex, 1);
      newPages.splice(hoverIndex, 0, draggedPage);
      return newPages;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('Iniciando envio do formulário');
    console.log('Tipo de capítulo:', formData.chapter_type);
    console.log('PDF selecionado:', pdfFile ? `${pdfFile.name} (${pdfFile.size} bytes)` : 'Nenhum');

    // Verificação adicional para PDF
    if (formData.chapter_type === 'pdf' && !pdfFile) {
      showNotification('Por favor, selecione um arquivo PDF', 'error');
      setErrors(prev => ({
        ...prev,
        pdf_file: 'Selecione um arquivo PDF'
      }));
      return;
    }

    if (!validateForm() || !manga) {
      console.log('Formulário inválido ou mangá não encontrado');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Passo 1: Criar o capítulo
      setCurrentStep('chapter');

      const chapterData: mangasService.ChapterCreateData = {
        title: formData.title,
        number: formData.number,
        manga: manga.id,
        chapter_type: formData.chapter_type
      };

      // Adicionar arquivo PDF se for um capítulo do tipo PDF
      if (formData.chapter_type === 'pdf' && pdfFile) {
        console.log('Arquivo PDF selecionado:', pdfFile.name, pdfFile.size);

        // Verificar se o arquivo é grande (mais de 20MB)
        const largeFileSizeThreshold = 20 * 1024 * 1024; // 20MB

        if (pdfFile.size > largeFileSizeThreshold) {
          // Para arquivos grandes, usar upload em partes
          console.log('Arquivo grande detectado, usando upload em partes');
          setCurrentStep('pdf_upload');

          try {
            // Fazer upload do arquivo PDF em partes
            const result = await mangasService.uploadPdfInChunks(pdfFile, (progress) => {
              setUploadProgress(progress);
            });

            console.log('Upload em partes concluído, resultado:', result);

            // Usar o caminho do arquivo para criar o capítulo
            chapterData.pdf_file_path = result.filePath;
            console.log('Definindo pdf_file_path:', result.filePath);
          } catch (uploadError) {
            console.error('Erro no upload em partes:', uploadError);
            if (uploadError && typeof uploadError === 'object' && 'message' in uploadError) {
              showNotification(uploadError.message as string, 'error');
            } else {
              showNotification('Erro ao fazer upload do arquivo PDF', 'error');
            }
            setIsSubmitting(false);
            return;
          }
        } else {
          // Para arquivos pequenos, usar upload direto
          console.log('Arquivo pequeno, usando upload direto');
          chapterData.pdf_file = pdfFile;
        }
      } else if (formData.chapter_type === 'pdf') {
        console.error('Tipo de capítulo é PDF, mas nenhum arquivo foi selecionado!');
        showNotification('Por favor, selecione um arquivo PDF', 'error');
        setIsSubmitting(false);
        return;
      }

      const newChapter = await mangasService.createChapter(chapterData);

      // Se for um capítulo de PDF, não precisamos fazer upload de páginas
      if (formData.chapter_type === 'pdf') {
        setUploadProgress(100);
        showNotification('Capítulo PDF criado com sucesso!', 'success');
        router.push(`/mangas/${params.slug}`);
        return;
      }

      // Para capítulos de imagens, continuar com o upload das páginas
      setUploadProgress(10); // 10% após criar o capítulo
      setCurrentStep('pages');

      // Calcular quanto cada página representa no progresso total (90% restantes)
      const progressPerPage = pages.length > 0 ? 90 / pages.length : 0;

      // Upload sequencial para mostrar progresso
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageData = {
          image: page.file,
          page_number: i + 1,
          chapter: newChapter.id
        };

        await mangasService.createPage(pageData);

        // Atualizar progresso após cada página
        setUploadProgress(10 + (i + 1) * progressPerPage);
      }

      showNotification('Capítulo criado com sucesso!', 'success');
      router.push(`/mangas/${params.slug}`);
    } catch (error) {
      console.error('Erro ao criar capítulo:', error);

      // Mostrar mensagem de erro mais específica
      if (error && typeof error === 'object') {
        if ('message' in error) {
          showNotification(error.message as string, 'error');

          // Se for um erro de arquivo muito grande
          if ('status' in error && error.status === 413) {
            setErrors(prev => ({
              ...prev,
              pdf_file: 'O arquivo PDF excede o tamanho máximo permitido.'
            }));
          }
        } else if ('pdf_file' in error && typeof error.pdf_file === 'string') {
          // Erro específico do campo pdf_file
          showNotification(error.pdf_file as string, 'error');
          setErrors(prev => ({
            ...prev,
            pdf_file: error.pdf_file as string
          }));
        } else {
          showNotification('Erro ao criar capítulo. Tente novamente.', 'error');
        }
      } else {
        showNotification('Erro ao criar capítulo. Tente novamente.', 'error');
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
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
      ) : manga ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Novo Capítulo</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Mangá: <span className="font-medium">{manga.title}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
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
                  placeholder="Título do capítulo"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número
                </label>
                <input
                  type="number"
                  id="number"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.number ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.number && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.number}</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Capítulo
              </label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center p-3 border rounded-lg cursor-pointer ${
                  formData.chapter_type === 'images'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  <input
                    type="radio"
                    name="chapter_type"
                    value="images"
                    checked={formData.chapter_type === 'images'}
                    onChange={() => {
                      setFormData(prev => ({ ...prev, chapter_type: 'images' }));
                      // Limpar o arquivo PDF quando mudar para o tipo imagens
                      setPdfFile(null);
                    }}
                    className="sr-only"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-white">Imagens</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Upload de múltiplas imagens
                    </span>
                  </div>
                </label>

                <label className={`flex-1 flex items-center p-3 border rounded-lg cursor-pointer ${
                  formData.chapter_type === 'pdf'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  <input
                    type="radio"
                    name="chapter_type"
                    value="pdf"
                    checked={formData.chapter_type === 'pdf'}
                    onChange={() => {
                      setFormData(prev => ({ ...prev, chapter_type: 'pdf' }));
                      // Limpar as páginas quando mudar para o tipo PDF
                      setPages([]);
                    }}
                    className="sr-only"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-white">PDF</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Upload de um arquivo PDF
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {formData.chapter_type === 'images' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Páginas
                </label>

              <div className={`border-2 border-dashed rounded-lg p-4 text-center mb-4 ${
                errors.pages ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}>
                <input
                  type="file"
                  id="pages"
                  name="pages"
                  onChange={handlePageUpload}
                  className="hidden"
                  accept="image/*"
                  multiple
                />
                <label
                  htmlFor="pages"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Clique para selecionar imagens
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    PNG, JPG ou WEBP (máx. 5MB cada)
                  </span>
                </label>
              </div>

              {errors.pages && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 mb-4">{errors.pages}</p>
              )}

              {pages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Páginas adicionadas ({pages.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {pages.map((page, index) => (
                      <div key={index} className="relative group">
                        <div className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={page.preview}
                            alt={`Página ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-0 right-0 p-1 bg-white dark:bg-gray-800 rounded-bl-lg text-xs font-medium">
                            {index + 1}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Arquivo PDF
                </label>

                <div className={`border-2 border-dashed rounded-lg p-4 text-center mb-4 ${
                  errors.pdf_file ? 'border-red-500' : pdfFile ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'
                }`}>
                  <input
                    type="file"
                    id="pdf_file"
                    name="pdf_file"
                    onChange={handlePdfUpload}
                    className="hidden"
                    accept="application/pdf"
                  />
                  <label
                    htmlFor="pdf_file"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    {pdfFile ? (
                      <>
                        <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          Arquivo selecionado
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Clique para selecionar outro arquivo
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Clique para selecionar um arquivo PDF
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          PDF (máx. 100MB)
                        </span>
                      </>
                    )}
                  </label>
                </div>

                {errors.pdf_file && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 mb-4">{errors.pdf_file}</p>
                )}

                {pdfFile ? (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Arquivo selecionado
                    </h3>
                    <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{pdfFile.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Abrir o seletor de arquivo novamente
                            const fileInput = document.getElementById('pdf_file') as HTMLInputElement;
                            if (fileInput) {
                              fileInput.click();
                            }
                          }}
                          className="p-1 bg-indigo-500 text-white rounded-full"
                          title="Selecionar outro arquivo"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPdfFile(null);
                            showNotification('Arquivo PDF removido', 'info');

                            // Limpar o input de arquivo para permitir selecionar o mesmo arquivo novamente
                            const fileInput = document.getElementById('pdf_file') as HTMLInputElement;
                            if (fileInput) {
                              fileInput.value = '';
                            }
                          }}
                          className="p-1 bg-red-500 text-white rounded-full"
                          title="Remover arquivo"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col items-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Nenhum arquivo selecionado. Por favor, selecione um arquivo PDF.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const fileInput = document.getElementById('pdf_file') as HTMLInputElement;
                        if (fileInput) {
                          fileInput.click();
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Selecionar PDF</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col">
              {isSubmitting ? (
                <div className="space-y-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300 ease-in-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                    {currentStep === 'chapter' ? (
                      <span>Criando capítulo... {Math.round(uploadProgress)}%</span>
                    ) : currentStep === 'pdf_upload' ? (
                      <span>Enviando arquivo PDF em partes... {Math.round(uploadProgress)}%</span>
                    ) : (
                      <span>Enviando páginas... {Math.round(uploadProgress)}%</span>
                    )}
                  </div>
                  {currentStep === 'pdf_upload' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      Enviando arquivo grande em partes para melhor desempenho...
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="submit"
                  className="self-end px-4 py-2 rounded-lg flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Save className="w-5 h-5" />
                  Salvar
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mangá não encontrado</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">O mangá que você está procurando não existe ou foi removido.</p>
          <Link
            href="/mangas"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Voltar para a lista de mangás
          </Link>
        </div>
      )}
    </div>
  );
}
