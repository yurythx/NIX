'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export default function Breadcrumbs({ 
  items = [], 
  showHome = true,
  className = ''
}: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Se não houver itens fornecidos, gerar automaticamente a partir do pathname
  const breadcrumbItems = items.length > 0 
    ? items 
    : generateBreadcrumbsFromPath(pathname);

  return (
    <nav aria-label="Breadcrumb" className={`text-sm ${className}`}>
      <ol className="flex flex-wrap items-center space-x-1">
        {showHome && (
          <li className="flex items-center">
            <Link 
              href="/" 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center"
            >
              <Home className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Início</span>
            </Link>
          </li>
        )}
        
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={index}>
            <li className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </li>
            <li className="flex items-center">
              {item.href ? (
                <Link 
                  href={item.href} 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-900 dark:text-white font-medium">
                  {item.label}
                </span>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}

// Função para gerar breadcrumbs a partir do pathname
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  // Remover a primeira barra e dividir o caminho
  const paths = pathname.split('/').filter(Boolean);
  
  // Mapeamento de slugs para nomes mais amigáveis
  const pathMap: Record<string, string> = {
    'artigos': 'Artigos',
    'novo': 'Novo Artigo',
    'editar': 'Editar',
    'mangas': 'Mangás',
    'categorias': 'Categorias',
    'usuarios': 'Usuários',
    'perfil': 'Perfil',
    'login': 'Login',
    'registro': 'Registro',
  };
  
  // Gerar os itens de breadcrumb
  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = '';
  
  paths.forEach((path, index) => {
    currentPath += `/${path}`;
    
    // Se for o último item, não adicionar href
    if (index === paths.length - 1) {
      breadcrumbs.push({
        label: pathMap[path] || path,
      });
    } else {
      breadcrumbs.push({
        label: pathMap[path] || path,
        href: currentPath,
      });
    }
  });
  
  return breadcrumbs;
}
