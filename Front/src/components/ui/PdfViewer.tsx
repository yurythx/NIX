'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface PdfViewerProps {
  pdfUrl: string;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfUrl,
  initialPage = 1,
  onPageChange,
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);

  // Carregar a biblioteca PDF.js
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        // Importar dinamicamente a biblioteca PDF.js
        const pdfjs = await import('pdfjs-dist');

        // Configurar o worker usando o arquivo baixado pelo script
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

        // Carregar o documento PDF
        const loadingTask = pdfjs.getDocument(pdfUrl);
        loadingTask.promise.then(
          (pdfDoc) => {
            pdfDocRef.current = pdfDoc;
            setTotalPages(pdfDoc.numPages);
            setIsLoading(false);
            renderPage(currentPage);
          },
          (reason) => {
            console.error('Erro ao carregar PDF:', reason);
            setError('Não foi possível carregar o PDF. Verifique se o arquivo é válido.');
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.error('Erro ao importar PDF.js:', err);
        setError('Não foi possível carregar a biblioteca de visualização de PDF.');
        setIsLoading(false);
      }
    };

    loadPdfJs();

    // Limpar recursos ao desmontar o componente
    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, [pdfUrl]);

  // Renderizar a página atual
  const renderPage = async (pageNumber: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;

    try {
      const page = await pdfDocRef.current.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        console.error('Não foi possível obter o contexto 2D do canvas');
        return;
      }

      // Calcular as dimensões da viewport
      const viewport = page.getViewport({ scale, rotation: rotation * 90 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Renderizar a página no canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Erro ao renderizar página:', err);
      setError(`Erro ao renderizar a página ${pageNumber}.`);
    }
  };

  // Navegar para a página anterior
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      renderPage(newPage);
      if (onPageChange) onPageChange(newPage);
    }
  };

  // Navegar para a próxima página
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      renderPage(newPage);
      if (onPageChange) onPageChange(newPage);
    }
  };

  // Aumentar o zoom
  const zoomIn = () => {
    const newScale = Math.min(scale + 0.2, 3);
    setScale(newScale);
    renderPage(currentPage);
  };

  // Diminuir o zoom
  const zoomOut = () => {
    const newScale = Math.max(scale - 0.2, 0.5);
    setScale(newScale);
    renderPage(currentPage);
  };

  // Rotacionar a página
  const rotate = () => {
    const newRotation = (rotation + 1) % 4;
    setRotation(newRotation);
    renderPage(currentPage);
  };

  // Atualizar a renderização quando a página atual mudar
  useEffect(() => {
    if (!isLoading && !error) {
      renderPage(currentPage);
    }
  }, [currentPage, scale, rotation]);

  return (
    <div className={`pdf-viewer ${className}`}>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      ) : (
        <>
          <div className="flex justify-center mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 flex items-center gap-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage <= 1}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                title="Página anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-sm">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                title="Próxima página"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2"></div>

              <button
                onClick={zoomIn}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-5 h-5" />
              </button>

              <button
                onClick={zoomOut}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Diminuir zoom"
              >
                <ZoomOut className="w-5 h-5" />
              </button>

              <button
                onClick={rotate}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Rotacionar"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex justify-center overflow-auto">
            <canvas ref={canvasRef} className="border border-gray-300 dark:border-gray-700 shadow-lg"></canvas>
          </div>
        </>
      )}
    </div>
  );
};

export default PdfViewer;
