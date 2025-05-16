'use client';

import React, { useState } from 'react';
import { Download, ExternalLink, AlertTriangle } from 'lucide-react';

interface PdfFallbackViewerProps {
  pdfUrl: string;
  errorMessage?: string;
  chapterTitle?: string;
}

/**
 * Componente de fallback para quando o visualizador de PDF não consegue carregar o PDF
 * Oferece opções para baixar o PDF ou abri-lo em uma nova aba
 */
const PdfFallbackViewer: React.FC<PdfFallbackViewerProps> = ({
  pdfUrl,
  errorMessage = "Não foi possível carregar o PDF no visualizador integrado.",
  chapterTitle = "Capítulo"
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Construir a URL completa do PDF
  const fullPdfUrl = pdfUrl.startsWith('http')
    ? pdfUrl
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${pdfUrl}`;
  
  // Extrair o nome do arquivo da URL
  const fileName = pdfUrl.split('/').pop() || 'arquivo.pdf';
  
  // Função para verificar se o PDF existe
  const checkPdfExists = async (): Promise<boolean> => {
    try {
      const response = await fetch(fullPdfUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Erro ao verificar existência do PDF:', error);
      return false;
    }
  };
  
  // Função para baixar o PDF
  const handleDownload = async () => {
    setIsLoading(true);
    
    try {
      // Verificar se o PDF existe
      const exists = await checkPdfExists();
      
      if (!exists) {
        alert('O arquivo PDF não foi encontrado no servidor.');
        setIsLoading(false);
        return;
      }
      
      // Criar um link temporário para download
      const link = document.createElement('a');
      link.href = fullPdfUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar o PDF:', error);
      alert('Ocorreu um erro ao baixar o PDF. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para abrir o PDF em uma nova aba
  const handleOpenInNewTab = async () => {
    setIsLoading(true);
    
    try {
      // Verificar se o PDF existe
      const exists = await checkPdfExists();
      
      if (!exists) {
        alert('O arquivo PDF não foi encontrado no servidor.');
        setIsLoading(false);
        return;
      }
      
      // Abrir em uma nova aba
      window.open(fullPdfUrl, '_blank');
    } catch (error) {
      console.error('Erro ao abrir o PDF:', error);
      alert('Ocorreu um erro ao abrir o PDF. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[70vh]">
      <div className="text-center max-w-2xl">
        <div className="mb-6 flex justify-center">
          <AlertTriangle size={48} className="text-amber-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Visualizador de PDF não disponível
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {errorMessage}
        </p>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800 mb-8">
          <h3 className="font-medium text-amber-800 dark:text-amber-300 mb-2">
            {chapterTitle}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Você pode baixar o PDF ou abri-lo diretamente no navegador usando os botões abaixo.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleDownload}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Download size={20} />
            <span>Baixar PDF</span>
          </button>
          
          <button
            onClick={handleOpenInNewTab}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <ExternalLink size={20} />
            <span>Abrir no Navegador</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfFallbackViewer;
