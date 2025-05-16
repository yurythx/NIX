'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Bookmark,
  BookmarkCheck,
  MessageSquarePlus,
  Settings,
  Maximize,
  Minimize,
  SlidersHorizontal,
  Rows,
  Columns,
  HelpCircle,
  Trash2,
  Edit,
  X
} from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import { useInView } from 'react-intersection-observer';
import { pdfReaderService, PdfAnnotation } from '../services/pdfReaderService';

// Configurar o worker do PDF.js
if (typeof window !== 'undefined') {
  // Tentar carregar o worker de várias fontes para garantir que funcione
  try {
    // Usar diretamente a versão local para evitar problemas com CDN
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

    console.log('PDF.js worker configurado com versão local:', pdfjs.GlobalWorkerOptions.workerSrc);

    // Verificar se o worker local está disponível
    fetch(pdfjs.GlobalWorkerOptions.workerSrc)
      .catch(error => {
        console.warn('Erro ao carregar worker local do PDF.js:', error);

        // Tentar CDN como fallback (usando versão estável 3.11.174)
        const cdnWorkerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        console.log('Tentando carregar worker do CDN:', cdnWorkerUrl);

        pdfjs.GlobalWorkerOptions.workerSrc = cdnWorkerUrl;
      });
  } catch (error) {
    console.error('Erro ao configurar worker do PDF.js:', error);
    // Último recurso - usar versão estável do CDN
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
}

interface PdfImageViewerProps {
  pdfUrl: string;
  chapterId: number; // ID do capítulo para persistência
  onPageChange?: (pageNumber: number) => void;
  onTotalPagesChange?: (totalPages: number) => void;
  isFullscreen?: boolean;
  initialPage?: number;
  preloadPages?: boolean; // Se true, pré-carrega páginas adjacentes para navegação mais rápida
  renderQuality?: number; // Qualidade de renderização (1.0 = 100%, 2.0 = 200%, etc.)
  readingMode?: 'paged' | 'continuous'; // Modo de leitura: paginado ou contínuo
  onBookmark?: (pageNumber: number) => void; // Callback quando um marcador é adicionado
  onAnnotationAdd?: (pageNumber: number, text: string) => void; // Callback quando uma anotação é adicionada
  onAnnotationUpdate?: (id: string, text: string) => void; // Callback quando uma anotação é atualizada
  onAnnotationDelete?: (id: string) => void; // Callback quando uma anotação é excluída
  accessibilityLabels?: Record<string, string>; // Rótulos de acessibilidade personalizados
  isMobile?: boolean; // Indica se está em um dispositivo móvel
}

const PdfImageViewer: React.FC<PdfImageViewerProps> = ({
  pdfUrl,
  chapterId,
  onPageChange,
  onTotalPagesChange,
  isFullscreen = false,
  initialPage = 1,
  preloadPages = true,
  renderQuality = 1.5,
  readingMode,
  onBookmark,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  accessibilityLabels = {},
  isMobile = false
}) => {
  // Carregar configurações salvas
  const savedSettings = useMemo(() => pdfReaderService.getSettings(), []);
  const savedProgress = useMemo(() => pdfReaderService.getReadingProgress(chapterId), [chapterId]);

  // Estados principais
  const [pdfDocument, setPdfDocument] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage || savedProgress || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(!isMobile);

  // Estados de visualização
  const [zoomLevel, setZoomLevel] = useState(savedSettings.zoomLevel || 100);
  const [rotation, setRotation] = useState(0);
  const [currentReadingMode, setCurrentReadingMode] = useState<'paged' | 'continuous'>(
    readingMode || savedSettings.readingMode || 'paged'
  );

  // Estados para recursos avançados
  const [showSettings, setShowSettings] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState('');
  const [editingAnnotation, setEditingAnnotation] = useState<PdfAnnotation | null>(null);
  const [allPageImages, setAllPageImages] = useState<Map<number, string>>(new Map());
  const [loadedPages, setLoadedPages] = useState<number[]>([currentPage]);

  // Carregar marcadores e anotações do localStorage
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [annotations, setAnnotations] = useState<Record<number, PdfAnnotation[]>>({});

  // Referências
  const pageCache = useRef<Map<number, string>>(new Map());
  const isMounted = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const annotationInputRef = useRef<HTMLTextAreaElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Rótulos de acessibilidade
  const labels = useMemo(() => ({
    nextPage: 'Próxima página',
    prevPage: 'Página anterior',
    zoomIn: 'Aumentar zoom',
    zoomOut: 'Diminuir zoom',
    rotate: 'Rotacionar página',
    bookmark: 'Adicionar marcador',
    annotation: 'Adicionar anotação',
    settings: 'Configurações',
    help: 'Ajuda',
    pageIndicator: 'Página {current} de {total}',
    ...accessibilityLabels
  }), [accessibilityLabels]);

  // Carregar marcadores e anotações
  useEffect(() => {
    const loadBookmarksAndAnnotations = () => {
      // Carregar marcadores
      const savedBookmarks = pdfReaderService.getBookmarks(chapterId);
      const bookmarkPages = savedBookmarks.map(b => b.pageNumber);
      setBookmarks(bookmarkPages);

      // Carregar anotações
      const savedAnnotations = pdfReaderService.getAnnotations(chapterId);
      const annotationsByPage: Record<number, PdfAnnotation[]> = {};

      savedAnnotations.forEach(annotation => {
        if (!annotationsByPage[annotation.pageNumber]) {
          annotationsByPage[annotation.pageNumber] = [];
        }
        annotationsByPage[annotation.pageNumber].push(annotation);
      });

      setAnnotations(annotationsByPage);
    };

    loadBookmarksAndAnnotations();
  }, [chapterId]);

  // Efeito para limpar referências quando o componente for desmontado
  useEffect(() => {
    return () => {
      isMounted.current = false;
      // Limpar o cache de páginas
      pageCache.current.clear();
    };
  }, []);

  // Carregar o documento PDF
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Limpar o cache ao carregar um novo PDF
        pageCache.current.clear();

        // Verificar se a URL do PDF está definida
        if (!pdfUrl) {
          throw new Error('URL do PDF não fornecida');
        }

        // Adicionar o prefixo da URL da API se necessário
        const fullUrl = pdfUrl.startsWith('http')
          ? pdfUrl
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${pdfUrl}`;

        console.log('Tentando carregar PDF de:', fullUrl);

        // Verificar se o arquivo existe antes de tentar carregá-lo
        try {
          const response = await fetch(fullUrl, { method: 'HEAD' });
          if (!response.ok) {
            throw new Error(`Arquivo PDF não encontrado (status: ${response.status})`);
          }
        } catch (fetchError) {
          console.error('Erro ao verificar existência do PDF:', fetchError);
          throw new Error('Não foi possível acessar o arquivo PDF. Verifique se o URL está correto.');
        }

        // Carregar o documento PDF com timeout
        const loadingTask = pdfjs.getDocument({
          url: fullUrl,
          cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
          disableRange: false,
          disableStream: false,
          disableAutoFetch: false
        });

        // Adicionar listener para progresso
        loadingTask.onProgress = (progress) => {
          console.log(`Carregamento do PDF: ${Math.round(progress.loaded / progress.total * 100)}%`);
        };

        // Usar Promise.race para adicionar timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Tempo limite excedido ao carregar o PDF')), 30000);
        });

        const pdf = await Promise.race([loadingTask.promise, timeoutPromise]) as pdfjs.PDFDocumentProxy;

        if (!isMounted.current) return;

        console.log('PDF carregado com sucesso. Número de páginas:', pdf.numPages);
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);

        if (onTotalPagesChange) {
          onTotalPagesChange(pdf.numPages);
        }

        // Carregar a página inicial
        await renderPage(pdf, initialPage);

        // Pré-carregar páginas adjacentes se a opção estiver ativada
        if (preloadPages) {
          // Pré-carregar a próxima página
          if (initialPage < pdf.numPages) {
            renderPage(pdf, initialPage + 1, true);
          }
          // Pré-carregar a página anterior
          if (initialPage > 1) {
            renderPage(pdf, initialPage - 1, true);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar PDF:', err);
        if (isMounted.current) {
          setError(`Não foi possível carregar o PDF: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    loadPdf();
  }, [pdfUrl, initialPage, preloadPages, onTotalPagesChange]);

  // Renderizar uma página do PDF como imagem
  const renderPage = useCallback(async (
    pdf: pdfjs.PDFDocumentProxy,
    pageNumber: number,
    preloadOnly: boolean = false,
    forContinuousMode: boolean = false
  ) => {
    try {
      console.log(`Tentando renderizar página ${pageNumber} (preloadOnly: ${preloadOnly}, forContinuousMode: ${forContinuousMode})`);

      // Verificar se o número da página é válido
      if (pageNumber < 1 || pageNumber > pdf.numPages) {
        throw new Error(`Número de página inválido: ${pageNumber}. O documento tem ${pdf.numPages} páginas.`);
      }

      // Verificar se a página já está em cache
      if (pageCache.current.has(pageNumber)) {
        console.log(`Página ${pageNumber} encontrada no cache`);
        const cachedImage = pageCache.current.get(pageNumber) || null;

        if (forContinuousMode) {
          setAllPageImages(prev => {
            const newMap = new Map(prev);
            newMap.set(pageNumber, cachedImage!);
            return newMap;
          });

          setLoadedPages(prev => {
            if (!prev.includes(pageNumber)) {
              return [...prev, pageNumber].sort((a, b) => a - b);
            }
            return prev;
          });
          return;
        }

        if (!preloadOnly) {
          setPageImage(cachedImage);
          setCurrentPage(pageNumber);

          if (onPageChange) {
            onPageChange(pageNumber);
          }
        }
        return;
      }

      if (!preloadOnly && !forContinuousMode) {
        setIsLoading(true);
      }

      // Obter a página com tratamento de erro
      let page;
      try {
        console.log(`Obtendo página ${pageNumber} do PDF`);
        page = await pdf.getPage(pageNumber);
      } catch (pageError) {
        console.error(`Erro ao obter página ${pageNumber}:`, pageError);
        throw new Error(`Não foi possível obter a página ${pageNumber} do PDF`);
      }

      // Definir a escala para renderização
      const viewport = page.getViewport({
        scale: renderQuality,
        rotation: rotation
      });

      console.log(`Viewport criado para página ${pageNumber}: ${viewport.width}x${viewport.height}`);

      // Criar um canvas para renderizar a página
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Não foi possível criar o contexto do canvas');
      }

      // Definir dimensões do canvas
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      console.log(`Canvas criado para página ${pageNumber}: ${canvas.width}x${canvas.height}`);

      // Renderizar a página no canvas com tratamento de erro
      try {
        console.log(`Iniciando renderização da página ${pageNumber} no canvas`);
        const renderTask = page.render({
          canvasContext: context,
          viewport: viewport
        });

        await renderTask.promise;
        console.log(`Página ${pageNumber} renderizada com sucesso`);
      } catch (renderError) {
        console.error(`Erro ao renderizar página ${pageNumber} no canvas:`, renderError);
        throw new Error(`Falha ao renderizar a página ${pageNumber} no canvas`);
      }

      // Converter o canvas para uma URL de dados
      let dataUrl;
      try {
        dataUrl = canvas.toDataURL('image/jpeg', 0.8); // Usar JPEG com 80% de qualidade para melhor performance
        console.log(`Página ${pageNumber} convertida para URL de dados`);
      } catch (dataUrlError) {
        console.error(`Erro ao converter canvas para URL de dados:`, dataUrlError);
        throw new Error('Falha ao converter a página renderizada para imagem');
      }

      // Adicionar ao cache
      pageCache.current.set(pageNumber, dataUrl);

      // Para o modo contínuo, adicionar à lista de imagens de todas as páginas
      if (forContinuousMode && isMounted.current) {
        setAllPageImages(prev => {
          const newMap = new Map(prev);
          newMap.set(pageNumber, dataUrl);
          return newMap;
        });

        setLoadedPages(prev => {
          if (!prev.includes(pageNumber)) {
            return [...prev, pageNumber].sort((a, b) => a - b);
          }
          return prev;
        });

        return;
      }

      if (!preloadOnly && isMounted.current) {
        setPageImage(dataUrl);
        setCurrentPage(pageNumber);

        // Salvar progresso de leitura
        pdfReaderService.saveReadingProgress(chapterId, pageNumber);

        if (onPageChange) {
          onPageChange(pageNumber);
        }

        // Pré-carregar páginas adjacentes se a opção estiver ativada
        if (preloadPages) {
          // Pré-carregar a próxima página
          if (pageNumber < totalPages) {
            setTimeout(() => {
              renderPage(pdf, pageNumber + 1, true);
            }, 100); // Pequeno atraso para não bloquear a UI
          }
          // Pré-carregar a página anterior
          if (pageNumber > 1) {
            setTimeout(() => {
              renderPage(pdf, pageNumber - 1, true);
            }, 200); // Pequeno atraso para não bloquear a UI
          }
        }
      }
    } catch (err) {
      console.error('Erro ao renderizar página:', err);
      if (!preloadOnly && !forContinuousMode && isMounted.current) {
        setError(`Não foi possível renderizar a página do PDF: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    } finally {
      if (!preloadOnly && !forContinuousMode && isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [chapterId, onPageChange, preloadPages, renderQuality, rotation, totalPages]);

  // Navegar para a próxima página
  const goToNextPage = useCallback(() => {
    if (pdfDocument && currentPage < totalPages) {
      renderPage(pdfDocument, currentPage + 1);
    }
  }, [pdfDocument, currentPage, totalPages, renderPage]);

  // Navegar para a página anterior
  const goToPrevPage = useCallback(() => {
    if (pdfDocument && currentPage > 1) {
      renderPage(pdfDocument, currentPage - 1);
    }
  }, [pdfDocument, currentPage, renderPage]);

  // Navegar para uma página específica
  const goToPage = useCallback((pageNum: number) => {
    if (pdfDocument && pageNum >= 1 && pageNum <= totalPages) {
      renderPage(pdfDocument, pageNum);
    }
  }, [pdfDocument, totalPages, renderPage]);

  // Rotacionar a página
  const rotateClockwise = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Gerenciar marcadores
  const toggleBookmark = useCallback((pageNum: number) => {
    try {
      // Verificar se a página já está marcada
      const isBookmarked = bookmarks.includes(pageNum);

      if (isBookmarked) {
        // Remover marcador
        pdfReaderService.removeBookmark(chapterId, pageNum);
        setBookmarks(prev => prev.filter(p => p !== pageNum));
      } else {
        // Adicionar marcador
        pdfReaderService.addBookmark(chapterId, pageNum);
        setBookmarks(prev => [...prev, pageNum].sort((a, b) => a - b));
      }

      // Chamar callback se existir
      if (onBookmark) {
        onBookmark(pageNum);
      }
    } catch (error) {
      console.error('Erro ao alternar marcador:', error);
    }
  }, [bookmarks, chapterId, onBookmark]);

  const isPageBookmarked = useCallback((pageNum: number) => {
    return bookmarks.includes(pageNum);
  }, [bookmarks]);

  // Gerenciar anotações
  const addAnnotation = useCallback((pageNum: number, text: string) => {
    if (!text.trim()) return;

    try {
      // Se estiver editando uma anotação existente
      if (editingAnnotation) {
        const updatedAnnotation = pdfReaderService.updateAnnotation(editingAnnotation.id, text);

        if (updatedAnnotation) {
          setAnnotations(prev => {
            const pageAnnotations = [...(prev[pageNum] || [])];
            const index = pageAnnotations.findIndex(a => a.id === editingAnnotation.id);

            if (index !== -1) {
              pageAnnotations[index] = updatedAnnotation;
            }

            return {
              ...prev,
              [pageNum]: pageAnnotations
            };
          });

          if (onAnnotationUpdate) {
            onAnnotationUpdate(editingAnnotation.id, text);
          }
        }
      } else {
        // Adicionar nova anotação
        const newAnnotation = pdfReaderService.addAnnotation(chapterId, pageNum, text);

        setAnnotations(prev => {
          const pageAnnotations = [...(prev[pageNum] || [])];

          return {
            ...prev,
            [pageNum]: [...pageAnnotations, newAnnotation]
          };
        });

        if (onAnnotationAdd) {
          onAnnotationAdd(pageNum, text);
        }
      }

      // Limpar estado
      setCurrentAnnotation('');
      setEditingAnnotation(null);
      setShowAnnotations(false);

      // Focar no visualizador após adicionar anotação
      if (containerRef.current) {
        containerRef.current.focus();
      }
    } catch (error) {
      console.error('Erro ao adicionar/atualizar anotação:', error);
    }
  }, [chapterId, editingAnnotation, onAnnotationAdd, onAnnotationUpdate]);

  const deleteAnnotation = useCallback((id: string, pageNum: number) => {
    try {
      const success = pdfReaderService.removeAnnotation(id);

      if (success) {
        setAnnotations(prev => {
          const pageAnnotations = [...(prev[pageNum] || [])];
          const filteredAnnotations = pageAnnotations.filter(a => a.id !== id);

          return {
            ...prev,
            [pageNum]: filteredAnnotations
          };
        });

        if (onAnnotationDelete) {
          onAnnotationDelete(id);
        }
      }
    } catch (error) {
      console.error('Erro ao excluir anotação:', error);
    }
  }, [onAnnotationDelete]);

  const editAnnotation = useCallback((annotation: PdfAnnotation) => {
    setEditingAnnotation(annotation);
    setCurrentAnnotation(annotation.text);
    setShowAnnotations(true);

    // Focar no campo de texto
    setTimeout(() => {
      if (annotationInputRef.current) {
        annotationInputRef.current.focus();
      }
    }, 100);
  }, []);

  const getPageAnnotations = useCallback((pageNum: number) => {
    return annotations[pageNum] || [];
  }, [annotations]);

  // Alternar modo de leitura
  const toggleReadingMode = useCallback(() => {
    setCurrentReadingMode(prev => {
      const newMode = prev === 'paged' ? 'continuous' : 'paged';
      // Salvar configuração
      pdfReaderService.saveSettings({ readingMode: newMode });
      return newMode;
    });
  }, []);

  // Manipular cliques na imagem para navegação
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Clique no lado direito (70% da largura) avança, lado esquerdo (30%) volta
    if (x > width * 0.3) {
      goToNextPage();
    } else {
      goToPrevPage();
    }
  }, [goToNextPage, goToPrevPage]);

  // Manipuladores de eventos de toque para dispositivos móveis
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Prevenir o comportamento padrão apenas se estivermos detectando um swipe horizontal
    if (touchStartX.current !== null && Math.abs(e.touches[0].clientX - touchStartX.current) > 50) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Verificar se o movimento foi mais horizontal que vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Verificar se o movimento foi significativo (mais de 50px)
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          // Swipe da esquerda para a direita (voltar)
          goToPrevPage();
        } else {
          // Swipe da direita para a esquerda (avançar)
          goToNextPage();
        }
      }
    }

    // Resetar as coordenadas
    touchStartX.current = null;
    touchStartY.current = null;
  }, [goToNextPage, goToPrevPage]);

  // Manipular teclado para navegação e outras funcionalidades
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar eventos de teclado quando estiver editando anotações
      if (showAnnotations && document.activeElement === annotationInputRef.current) {
        // Permitir apenas Escape para sair do modo de anotação
        if (e.key === 'Escape') {
          setShowAnnotations(false);
          if (containerRef.current) {
            containerRef.current.focus();
          }
        }
        return;
      }

      // Navegação
      if (e.key === 'ArrowRight' || e.key === ' ') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft') {
        goToPrevPage();
      } else if (e.key === 'Home') {
        goToPage(1);
      } else if (e.key === 'End') {
        goToPage(totalPages);
      }
      // Visualização
      else if (e.key === 'r' || e.key === 'R') {
        rotateClockwise();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel(prev => Math.min(prev + 10, 200));
      } else if (e.key === '-') {
        setZoomLevel(prev => Math.max(prev - 10, 50));
      } else if (e.key === '0') {
        setZoomLevel(100);
      }
      // Modo de leitura
      else if (e.key === 'm' || e.key === 'M') {
        toggleReadingMode();
      }
      // Marcadores
      else if (e.key === 'b' || e.key === 'B') {
        toggleBookmark(currentPage);
      }
      // Anotações
      else if (e.key === 'a' || e.key === 'A') {
        setShowAnnotations(prev => !prev);
        // Focar no campo de anotação quando abrir
        if (!showAnnotations) {
          setTimeout(() => {
            if (annotationInputRef.current) {
              annotationInputRef.current.focus();
            }
          }, 100);
        }
      }
      // Configurações
      else if (e.key === 's' || e.key === 'S') {
        setShowSettings(prev => !prev);
      }
      // Ajuda
      else if (e.key === 'h' || e.key === 'H' || e.key === '?') {
        setShowHelp(prev => !prev);
      }
      // Tela cheia (F11 é tratado pelo navegador)
      else if (e.key === 'f' || e.key === 'F') {
        // Não implementamos aqui pois geralmente é controlado pelo componente pai
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    goToNextPage,
    goToPrevPage,
    goToPage,
    rotateClockwise,
    toggleReadingMode,
    toggleBookmark,
    currentPage,
    totalPages,
    showAnnotations
  ]);

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

    const handleMouseLeave = () => {
      if (isFullscreen) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          setShowControls(false);
        }, 1000);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timeout);
    };
  }, [isFullscreen]);

  // Funções para controlar o zoom
  const zoomIn = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.min(prev + 10, 200);
      pdfReaderService.saveSettings({ zoomLevel: newZoom });
      return newZoom;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 10, 50);
      pdfReaderService.saveSettings({ zoomLevel: newZoom });
      return newZoom;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(100);
    pdfReaderService.saveSettings({ zoomLevel: 100 });
  }, []);

  // Efeito para re-renderizar a página quando o zoom ou rotação mudar
  useEffect(() => {
    if (pdfDocument && currentPage) {
      renderPage(pdfDocument, currentPage);
    }
  }, [pdfDocument, currentPage, rotation, renderPage]);

  // Efeito para carregar todas as páginas no modo contínuo
  useEffect(() => {
    if (pdfDocument && currentReadingMode === 'continuous') {
      const loadAllPages = async () => {
        setIsLoading(true);

        // Criar um array com números de página de 1 a totalPages
        const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

        // Carregar as primeiras 5 páginas imediatamente
        const initialPages = pageNumbers.slice(0, 5);
        for (const pageNum of initialPages) {
          if (!allPageImages.has(pageNum)) {
            await renderPage(pdfDocument, pageNum, false, true);
          }
        }

        // Carregar o resto das páginas em segundo plano
        setTimeout(async () => {
          const remainingPages = pageNumbers.slice(5);
          for (const pageNum of remainingPages) {
            if (!isMounted.current) return;
            if (!allPageImages.has(pageNum)) {
              await renderPage(pdfDocument, pageNum, false, true);
              // Pequena pausa para não bloquear a UI
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          }
        }, 500);

        setIsLoading(false);
      };

      loadAllPages();
    }
  }, [pdfDocument, currentReadingMode, totalPages, allPageImages, renderPage]);

  // Componente para renderizar uma página no modo contínuo
  const ContinuousPageItem = useCallback(({ pageNum }: { pageNum: number }) => {
    const { ref, inView } = useInView({
      threshold: 0.1,
      triggerOnce: false
    });

    // Quando a página fica visível, atualizar a página atual
    useEffect(() => {
      if (inView && currentPage !== pageNum) {
        setCurrentPage(pageNum);
        if (onPageChange) {
          onPageChange(pageNum);
        }
      }
    }, [inView, pageNum]);

    const pageImage = allPageImages.get(pageNum);
    const hasAnnotations = getPageAnnotations(pageNum).length > 0;
    const isBookmarked = isPageBookmarked(pageNum);

    return (
      <div
        ref={ref}
        className="relative mb-8 flex flex-col items-center"
        id={`page-${pageNum}`}
      >
        {/* Indicador de página */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Página {pageNum} de {totalPages}
        </div>

        {/* Imagem da página */}
        <div className="relative">
          {pageImage ? (
            <img
              src={pageImage}
              alt={`Página ${pageNum}`}
              className="max-w-full object-contain shadow-lg"
              style={{ transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)` }}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-[600px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}

          {/* Indicadores de marcador e anotações */}
          <div className="absolute top-2 right-2 flex gap-1">
            {isBookmarked && (
              <div className="bg-yellow-500 p-1 rounded-full" title="Página marcada">
                <BookmarkCheck className="w-4 h-4 text-white" />
              </div>
            )}
            {hasAnnotations && (
              <div className="bg-blue-500 p-1 rounded-full" title="Página com anotações">
                <MessageSquarePlus className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Anotações da página */}
        {hasAnnotations && (
          <div className="mt-2 w-full max-w-2xl bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Anotações:</h4>
            <ul className="space-y-1">
              {getPageAnnotations(pageNum).map((annotation, idx) => (
                <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                  • {annotation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }, [allPageImages, currentPage, getPageAnnotations, isPageBookmarked, onPageChange, rotation, totalPages, zoomLevel]);

  // Detectar se é um dispositivo móvel
  const detectMobile = useCallback(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    return false;
  }, []);

  // Estado para controlar se é um dispositivo móvel
  const [isMobileDevice, setIsMobileDevice] = useState(isMobile);

  // Atualizar o estado quando a janela for redimensionada
  useEffect(() => {
    const handleResize = () => {
      setIsMobileDevice(detectMobile());
    };

    // Verificar inicialmente
    handleResize();

    // Adicionar listener para redimensionamento
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [detectMobile]);

  // Renderizar o componente principal
  return (
    <div
      ref={containerRef}
      className={`relative ${isFullscreen ? 'h-screen overflow-hidden' : 'min-h-[70vh]'}`}
      onClick={currentReadingMode === 'paged' ? handleImageClick : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={0} // Para poder receber eventos de teclado
    >
      {isLoading && allPageImages.size === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Erro ao Carregar PDF</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <div className="max-w-lg mx-auto bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="font-medium text-red-800 dark:text-red-300 mb-2">Sugestões para resolver o problema:</h3>
            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>Verifique se o arquivo PDF existe no servidor</li>
              <li>Tente recarregar a página</li>
              <li>Verifique sua conexão com a internet</li>
              <li>Tente baixar o PDF diretamente usando o link abaixo</li>
            </ul>
            <div className="mt-4">
              <a
                href={pdfUrl.startsWith('http') ? pdfUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${pdfUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Baixar PDF Diretamente
              </a>
            </div>
          </div>
        </div>
      ) : currentReadingMode === 'paged' && pageImage ? (
        // Modo de leitura paginado
        <div className="flex justify-center items-center h-full">
          <img
            src={pageImage}
            alt={`Página ${currentPage}`}
            className={`max-h-full max-w-full object-contain ${isFullscreen ? 'h-screen' : ''}`}
            style={{ transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)` }}
            loading="lazy"
          />

          {/* Indicadores de marcador e anotações */}
          {(isPageBookmarked(currentPage) || getPageAnnotations(currentPage).length > 0) && (
            <div className="absolute top-4 right-4 flex gap-1">
              {isPageBookmarked(currentPage) && (
                <div className="bg-yellow-500 p-1 rounded-full" title="Página marcada">
                  <BookmarkCheck className="w-5 h-5 text-white" />
                </div>
              )}
              {getPageAnnotations(currentPage).length > 0 && (
                <div className="bg-blue-500 p-1 rounded-full" title="Página com anotações">
                  <MessageSquarePlus className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          )}

          {/* Indicador de página e controles inferiores */}
          {showControls && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-3">
              {/* Navegação de página */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); goToPage(1); }}
                  className="p-1 hover:bg-gray-700 rounded"
                  disabled={currentPage <= 1}
                  title={labels.prevPage}
                  aria-label={labels.prevPage}
                >
                  1
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPrevPage(); }}
                  className="p-1 hover:bg-gray-700 rounded"
                  disabled={currentPage <= 1}
                  title={labels.prevPage}
                  aria-label={labels.prevPage}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <span className="mx-1" aria-live="polite">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={(e) => { e.stopPropagation(); goToNextPage(); }}
                  className="p-1 hover:bg-gray-700 rounded"
                  disabled={currentPage >= totalPages}
                  title={labels.nextPage}
                  aria-label={labels.nextPage}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPage(totalPages); }}
                  className="p-1 hover:bg-gray-700 rounded"
                  disabled={currentPage >= totalPages}
                  title="Última página"
                  aria-label="Última página"
                >
                  {totalPages}
                </button>
              </div>

              {/* Separador */}
              <div className="h-5 w-px bg-gray-500"></div>

              {/* Controles de zoom e rotação */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                  className="p-1 hover:bg-gray-700 rounded"
                  title={labels.zoomOut}
                  aria-label={labels.zoomOut}
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-xs">{zoomLevel}%</span>
                <button
                  onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                  className="p-1 hover:bg-gray-700 rounded"
                  title={labels.zoomIn}
                  aria-label={labels.zoomIn}
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); rotateClockwise(); }}
                  className="p-1 hover:bg-gray-700 rounded"
                  title={labels.rotate}
                  aria-label={labels.rotate}
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              </div>

              {/* Separador */}
              <div className="h-5 w-px bg-gray-500"></div>

              {/* Controles avançados */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleBookmark(currentPage); }}
                  className={`p-1 hover:bg-gray-700 rounded ${isPageBookmarked(currentPage) ? 'text-yellow-400' : ''}`}
                  title={labels.bookmark}
                  aria-label={labels.bookmark}
                >
                  {isPageBookmarked(currentPage) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAnnotations(prev => !prev); }}
                  className={`p-1 hover:bg-gray-700 rounded ${showAnnotations ? 'text-blue-400' : ''}`}
                  title={labels.annotation}
                  aria-label={labels.annotation}
                >
                  <MessageSquarePlus className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleReadingMode(); }}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Alternar modo de leitura (tecla M)"
                  aria-label="Alternar modo de leitura"
                >
                  {currentReadingMode === 'paged' ? <Rows className="w-5 h-5" /> : <Columns className="w-5 h-5" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowHelp(prev => !prev); }}
                  className={`p-1 hover:bg-gray-700 rounded ${showHelp ? 'text-blue-400' : ''}`}
                  title={labels.help}
                  aria-label={labels.help}
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Botões de navegação laterais */}
          {showControls && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevPage(); }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                disabled={currentPage <= 1}
                aria-label={labels.prevPage}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); goToNextPage(); }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                disabled={currentPage >= totalPages}
                aria-label={labels.nextPage}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      ) : currentReadingMode === 'continuous' ? (
        // Modo de leitura contínua
        <div className={`flex flex-col items-center p-4 ${isFullscreen ? 'h-screen overflow-y-auto' : ''}`}>
          {/* Barra de controle superior fixa */}
          {showControls && (
            <div className="sticky top-0 z-10 w-full max-w-3xl bg-white dark:bg-gray-800 shadow-md rounded-lg p-3 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleReadingMode()}
                  className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"
                  title="Voltar ao modo paginado (tecla M)"
                >
                  <Columns className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium">Modo contínuo</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => zoomOut()}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title={labels.zoomOut}
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-xs">{zoomLevel}%</span>
                <button
                  onClick={() => zoomIn()}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title={labels.zoomIn}
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={() => rotateClockwise()}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title={labels.rotate}
                >
                  <RotateCw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowHelp(prev => !prev)}
                  className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded ${showHelp ? 'text-blue-600 dark:text-blue-400' : ''}`}
                  title={labels.help}
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Páginas em modo contínuo */}
          <div className="w-full max-w-3xl">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <ContinuousPageItem key={pageNum} pageNum={pageNum} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300">Nenhuma página para exibir.</p>
        </div>
      )}

      {/* Painel de anotações */}
      {showAnnotations && currentReadingMode === 'paged' && (
        <div className={`absolute ${isMobileDevice ? 'inset-0 bg-black bg-opacity-50' : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'} z-20`}>
          <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg ${isMobileDevice ? 'mx-auto my-20 max-w-[90%]' : 'w-80'}`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">
                {editingAnnotation ? 'Editar anotação' : 'Anotações para página ' + currentPage}
              </h3>
              <button
                onClick={() => {
                  setShowAnnotations(false);
                  setEditingAnnotation(null);
                  setCurrentAnnotation('');
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editingAnnotation && getPageAnnotations(currentPage).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Anotações existentes:</h4>
                <ul className="space-y-2 text-sm max-h-[200px] overflow-y-auto">
                  {getPageAnnotations(currentPage).map((annotation) => (
                    <li key={annotation.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded relative group">
                      <p className="pr-16">{annotation.text}</p>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => editAnnotation(annotation)}
                          className="p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded"
                          title="Editar anotação"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteAnnotation(annotation.id, annotation.pageNumber)}
                          className="p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded"
                          title="Excluir anotação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(annotation.createdAt).toLocaleDateString()}
                        {annotation.updatedAt && ` (editado em ${new Date(annotation.updatedAt).toLocaleDateString()})`}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <label htmlFor="annotation" className="block text-sm font-medium mb-1">
                {editingAnnotation ? 'Editar anotação:' : 'Nova anotação:'}
              </label>
              <textarea
                ref={annotationInputRef}
                id="annotation"
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                rows={isMobileDevice ? 4 : 3}
                value={currentAnnotation}
                onChange={(e) => setCurrentAnnotation(e.target.value)}
                placeholder="Digite sua anotação aqui..."
              />
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setShowAnnotations(false);
                  setEditingAnnotation(null);
                  setCurrentAnnotation('');
                }}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => addAnnotation(currentPage, currentAnnotation)}
                className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
                disabled={!currentAnnotation.trim()}
              >
                {editingAnnotation ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Painel de ajuda */}
      {showHelp && (
        <div className={`absolute ${isMobileDevice ? 'inset-0 bg-black bg-opacity-50' : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'} z-20`}>
          <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg ${isMobileDevice ? 'mx-auto my-10 max-w-[90%]' : 'w-80'} max-h-[80vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Ajuda</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {isMobileDevice ? (
                <div>
                  <h4 className="text-sm font-medium mb-1">Gestos de toque</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span>Próxima página</span>
                      <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">Deslizar para esquerda</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Página anterior</span>
                      <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">Deslizar para direita</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Mostrar/esconder controles</span>
                      <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">Tocar na tela</span>
                    </li>
                  </ul>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm font-medium mb-1">Navegação</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span>Próxima página</span>
                      <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">→ ou Espaço</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Página anterior</span>
                      <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">←</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Primeira página</span>
                      <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">Home</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Última página</span>
                      <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">End</span>
                    </li>
                  </ul>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-1">Visualização</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex justify-between">
                    <span>Aumentar zoom</span>
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{isMobileDevice ? 'Botão +' : '+ ou ='}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Diminuir zoom</span>
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{isMobileDevice ? 'Botão -' : '-'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Resetar zoom</span>
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{isMobileDevice ? 'Botão 100%' : '0'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Rotacionar página</span>
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{isMobileDevice ? 'Botão rotação' : 'R'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Alternar modo de leitura</span>
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{isMobileDevice ? 'Botão modo' : 'M'}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Ferramentas</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex justify-between">
                    <span>Adicionar/remover marcador</span>
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{isMobileDevice ? 'Botão marcador' : 'B'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Adicionar anotação</span>
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{isMobileDevice ? 'Botão anotação' : 'A'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Mostrar/esconder ajuda</span>
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{isMobileDevice ? 'Botão ajuda' : 'H ou ?'}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Sobre</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Este visualizador de PDF permite ler documentos com facilidade, adicionar marcadores e anotações,
                  e escolher entre modo de leitura paginado ou contínuo. Suas configurações e progresso de leitura
                  são salvos automaticamente.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfImageViewer;
