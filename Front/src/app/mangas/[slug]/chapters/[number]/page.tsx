'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Maximize, Minimize, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import mangasService from '../../../../../services/api/mangas.service';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useNotification } from '../../../../../contexts/NotificationContext';
import PdfImageViewer from '../../../../../components/PdfImageViewer';
import PdfFallbackViewer from '../../../../../components/PdfFallbackViewer';
import UnifiedCommentList from '../../../../../components/comments/UnifiedCommentList';
import { ContentType } from '../../../../../services/api/unified-comments.service';

interface Page {
  id: number;
  image: string;
  page_number: number;
}

interface Chapter {
  id: number;
  title: string;
  number: number;
  pages: Page[];
  created_at: string;
  chapter_type: string;
  pdf_file?: string;
}

export default function ChapterPage({ params }: { params: { slug: string; number: string } }) {
  console.log('Renderizando ChapterPage com params:', params);

  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manga, setManga] = useState<{ id: number; title: string; slug: string } | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [nextChapter, setNextChapter] = useState<{ number: number } | null>(null);
  const [prevChapter, setPrevChapter] = useState<{ number: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [readingMode, setReadingMode] = useState<'paged' | 'continuous'>('paged');
  const [showSettings, setShowSettings] = useState(false);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(0);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  const [useFallbackViewer, setUseFallbackViewer] = useState(false);

  // Carregar dados do mangá e capítulo
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Buscar o mangá
        const mangaData = await mangasService.getMangaBySlug(params.slug);
        if (!mangaData) {
          setError('Mangá não encontrado');
          return;
        }

        setManga({
          id: mangaData.id,
          title: mangaData.title,
          slug: mangaData.slug
        });

        // Buscar todos os capítulos para navegação
        const chaptersData = await mangasService.getChaptersByManga(params.slug);
        const sortedChapters = [...chaptersData].sort((a, b) => a.number - b.number);

        const chapterNumber = parseInt(params.number);
        const currentChapterIndex = sortedChapters.findIndex(c => c.number === chapterNumber);

        if (currentChapterIndex === -1) {
          setError('Capítulo não encontrado');
          return;
        }

        // Definir capítulos anterior e próximo
        if (currentChapterIndex > 0) {
          setPrevChapter(sortedChapters[currentChapterIndex - 1]);
        }

        if (currentChapterIndex < sortedChapters.length - 1) {
          setNextChapter(sortedChapters[currentChapterIndex + 1]);
        }

        // Buscar as páginas do capítulo
        const currentChapter = sortedChapters[currentChapterIndex];
        const pagesData = await mangasService.getPagesByChapter(currentChapter.id);
        const sortedPages = pagesData.sort((a, b) => a.page_number - b.page_number);

        console.log('Capítulo carregado:', currentChapter);
        console.log('Páginas carregadas:', sortedPages);

        setChapter({
          ...currentChapter,
          pages: sortedPages
        });

        // Salvar progresso de leitura
        if (isAuthenticated && currentChapter) {
          saveReadingProgress(currentChapter.id);
        }

        setError(null);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError('Erro ao carregar o capítulo. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.slug, params.number, isAuthenticated]);

  // Salvar progresso de leitura
  const saveReadingProgress = async (chapterId: number, pageId?: number) => {
    if (!isAuthenticated) return;

    try {
      await mangasService.updateReadingProgress(params.slug, chapterId, pageId);
    } catch (error) {
      console.error('Erro ao salvar progresso de leitura:', error);
    }
  };

  // Navegação entre páginas
  const goToNextPage = () => {
    if (!chapter || currentPage >= chapter.pages.length - 1) {
      if (nextChapter) {
        router.push(`/mangas/${params.slug}/chapters/${nextChapter.number}`);
      }
      return;
    }

    const newPage = currentPage + 1;
    setCurrentPage(newPage);

    if (chapter && (newPage % 3 === 0 || newPage === chapter.pages.length - 1)) {
      saveReadingProgress(chapter.id, chapter.pages[newPage].id);
    }
  };

  const goToPrevPage = () => {
    if (currentPage <= 0) {
      if (prevChapter) {
        router.push(`/mangas/${params.slug}/chapters/${prevChapter.number}`);
      }
      return;
    }

    setCurrentPage(prev => prev - 1);
  };

  // Manipular teclado para navegação
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft') {
        goToPrevPage();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (showSettings) {
          setShowSettings(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, chapter, nextChapter, prevChapter, isFullscreen, showSettings]);

  // Manipular cliques na imagem para navegação
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x > width * 0.3) {
      goToNextPage();
    } else {
      goToPrevPage();
    }
  };

  // Alternar modo tela cheia
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  // Funções para controlar o zoom
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const resetZoom = () => {
    setZoomLevel(100);
  };

  // Mostrar/esconder controles ao mover o mouse
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowControls(true);

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isFullscreen) {
          setShowControls(false);
        }
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isFullscreen]);

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      {/* Barra de navegação superior */}
      {showControls && (
        <div className={`flex items-center justify-between p-4 ${isFullscreen ? 'absolute top-0 left-0 right-0 bg-black bg-opacity-50 z-10' : 'bg-white dark:bg-gray-800 rounded-lg shadow-md mb-4'}`}>
          <div className="flex items-center gap-4">
            <Link href={`/mangas/${params.slug}`} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1">
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </Link>

            {manga && (
              <div className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">{manga.title}</span>
                <span className="mx-2">•</span>
                <span>Capítulo {params.number}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {prevChapter && (
              <Link
                href={`/mangas/${params.slug}/chapters/${prevChapter.number}`}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Capítulo anterior (←)"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
            )}

            {nextChapter && (
              <Link
                href={`/mangas/${params.slug}/chapters/${nextChapter.number}`}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Próximo capítulo (→)"
              >
                <ChevronRight className="w-5 h-5" />
              </Link>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title={isFullscreen ? 'Sair da tela cheia (F)' : 'Tela cheia (F)'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Erro</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <Link
            href={`/mangas/${params.slug}`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Voltar para o mangá
          </Link>
        </div>
      ) : chapter ? (
        chapter.chapter_type === 'pdf' && chapter.pdf_file ? (
          // Visualizador de PDF como imagens
          <div className="w-full">
            {/* Botão para baixar o PDF diretamente - sempre visível */}
            <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-indigo-800 dark:text-indigo-300">Visualizador de PDF</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Se tiver problemas para visualizar o PDF, você pode baixá-lo diretamente.
                </p>
              </div>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${chapter.pdf_file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Baixar PDF
              </a>
            </div>

            {/* Tentar usar o visualizador avançado primeiro, com fallback para o visualizador simples */}
            {useFallbackViewer ? (
              <PdfFallbackViewer
                pdfUrl={chapter.pdf_file}
                errorMessage={pdfLoadError || "Não foi possível carregar o PDF no visualizador integrado."}
                chapterTitle={chapter.title}
              />
            ) : (
              <div className="relative">
                {/* Botão para alternar para o visualizador de fallback */}
                <button
                  onClick={() => setUseFallbackViewer(true)}
                  className="absolute top-2 right-2 z-10 px-3 py-1 bg-gray-800 bg-opacity-70 text-white text-xs rounded-md hover:bg-opacity-90"
                >
                  Problemas? Tente o visualizador alternativo
                </button>

                <PdfImageViewer
                  pdfUrl={chapter.pdf_file}
                  chapterId={chapter.id}
                  isFullscreen={isFullscreen}
                  initialPage={pdfCurrentPage}
                  preloadPages={true}
                  renderQuality={1.5}
                  readingMode={readingMode}
                  onPageChange={(pageNumber) => {
                    setPdfCurrentPage(pageNumber);
                    // Salvar progresso a cada mudança de página
                    if (chapter && chapter.id) {
                      saveReadingProgress(chapter.id);
                    }
                  }}
                  onTotalPagesChange={(total) => setPdfTotalPages(total)}
                  onBookmark={(pageNumber) => {
                    console.log(`Marcador adicionado/removido na página ${pageNumber}`);
                  }}
                  onAnnotationAdd={(pageNumber, text) => {
                    console.log(`Anotação adicionada na página ${pageNumber}: ${text}`);
                  }}
                  onAnnotationUpdate={(id, text) => {
                    console.log(`Anotação atualizada: ${id} - ${text}`);
                  }}
                  onAnnotationDelete={(id) => {
                    console.log(`Anotação excluída: ${id}`);
                  }}
                  accessibilityLabels={{
                    nextPage: 'Ir para a próxima página',
                    prevPage: 'Voltar para a página anterior',
                    zoomIn: 'Aumentar zoom',
                    zoomOut: 'Diminuir zoom',
                    rotate: 'Rotacionar página',
                    bookmark: 'Marcar/desmarcar página',
                    annotation: 'Adicionar anotação',
                    settings: 'Configurações',
                    help: 'Ajuda',
                    pageIndicator: 'Página {current} de {total}'
                  }}
                  isMobile={typeof window !== 'undefined' ? window.innerWidth <= 768 : false}
                />
              </div>
            )}

            {/* Dicas de navegação - visíveis apenas quando não está em tela cheia e não está usando o fallback */}
            {!isFullscreen && !useFallbackViewer && (
              <div className="p-4 mt-4 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Dicas de Navegação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No Teclado:</h4>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-4">
                      <li>Setas <span className="font-mono">←</span> e <span className="font-mono">→</span> para navegar entre páginas</li>
                      <li>Teclas <span className="font-mono">+</span> e <span className="font-mono">-</span> para zoom</li>
                      <li><span className="font-mono">R</span> para rotacionar a página</li>
                      <li><span className="font-mono">M</span> para alternar entre modos de leitura</li>
                      <li><span className="font-mono">B</span> para adicionar/remover marcadores</li>
                      <li><span className="font-mono">A</span> para adicionar anotações</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Em Dispositivos Móveis:</h4>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-4">
                      <li>Deslize para a esquerda/direita para navegar entre páginas</li>
                      <li>Toque na tela para mostrar/esconder controles</li>
                      <li>Use os botões na interface para zoom, rotação e outras funções</li>
                      <li>Toque no ícone de ajuda para ver mais dicas</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : chapter.pages.length > 0 ? (
          // Visualizador de imagens
          <div
            className={`relative flex justify-center items-center ${isFullscreen ? 'h-screen' : 'min-h-[70vh]'}`}
            onClick={handleImageClick}
          >
            <img
              src={chapter.pages[currentPage].image}
              alt={`Página ${currentPage + 1}`}
              className={`max-h-full max-w-full object-contain ${isFullscreen ? 'h-screen' : ''}`}
              style={{ transform: `scale(${zoomLevel / 100})` }}
              loading="lazy"
              onLoad={() => {
                // Pré-carregar a próxima página
                if (currentPage < chapter.pages.length - 1) {
                  const nextImage = new Image();
                  nextImage.src = chapter.pages[currentPage + 1].image;
                }

                // Salvar progresso de leitura
                saveReadingProgress(chapter.id, chapter.pages[currentPage].id);
              }}
            />

          {/* Indicador de página */}
          {showControls && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {currentPage + 1} / {chapter.pages.length}
            </div>
          )}

          {/* Botões de navegação */}
          {showControls && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevPage(); }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                disabled={currentPage <= 0 && !prevChapter}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); goToNextPage(); }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                disabled={currentPage >= chapter.pages.length - 1 && !nextChapter}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sem páginas</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Este capítulo não possui páginas.</p>
            <Link
              href={`/mangas/${params.slug}`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Voltar para o mangá
            </Link>
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Capítulo não encontrado</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Não foi possível carregar o capítulo.</p>
          <Link
            href={`/mangas/${params.slug}`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Voltar para o mangá
          </Link>
        </div>
      )}

      {/* Seção de comentários - visível apenas quando não está em tela cheia */}
      {!isLoading && !error && chapter && !isFullscreen && (
        <div className="mt-8">
          <UnifiedCommentList
            contentType={ContentType.CHAPTER}
            contentId={chapter.id}
            title="Comentários do Capítulo"
          />
        </div>
      )}
    </div>
  );
}
