'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Não renderizar paginação se houver apenas uma página
  if (totalPages <= 1) {
    return null;
  }

  // Função para gerar array de páginas a serem exibidas
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Se o total de páginas for menor ou igual ao máximo a ser exibido, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Sempre mostrar a primeira página
      pageNumbers.push(1);
      
      // Calcular páginas do meio
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Ajustar se estiver no início ou fim
      if (currentPage <= 2) {
        endPage = 4;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 3;
      }
      
      // Adicionar elipses se necessário
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Adicionar páginas do meio
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Adicionar elipses se necessário
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Sempre mostrar a última página
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  return (
    <div className="flex justify-center items-center mt-8">
      <nav className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500 dark:text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(page as number)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === page
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Próxima página"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </nav>
    </div>
  );
}
