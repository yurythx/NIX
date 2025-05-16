'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Settings,
  Users,
  BarChart,
  MessageSquare,
  Tag,
  Folder,
  Bookmark,
  Star,
  Clock,
  TrendingUp,
  BookOpenCheck,
  BookOpenText,
  BookOpenIcon,
  BookOpenCheckIcon,
  BookOpenTextIcon,
  User,
  ChevronRight,
  ChevronLeft,
  Book,
} from 'lucide-react';
import SubMenu from './SubMenu';
import { useSidebar } from './SidebarProvider';

interface SidebarProps {
  isAuthenticated?: boolean;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function Sidebar({
  isAuthenticated = false,
  user,
}: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const menuItems = {
    artigos: {
      title: 'Artigos',
      icon: <FileText className="w-5 h-5" />,
      items: [
        {
          icon: <BookOpen className="w-4 h-4" />,
          label: 'Todos os Artigos',
          href: '/artigos',
        },
        {
          icon: <Bookmark className="w-4 h-4" />,
          label: 'Favoritos',
          href: '/artigos/favoritos',
        },
        {
          icon: <Clock className="w-4 h-4" />,
          label: 'Recentes',
          href: '/artigos/recentes',
        },
        {
          icon: <TrendingUp className="w-4 h-4" />,
          label: 'Populares',
          href: '/artigos/populares',
        },
      ],
    },
    livros: {
      title: 'Livros',
      icon: <Book className="w-5 h-5" />,
      items: [
        {
          icon: <Book className="w-4 h-4" />,
          label: 'Todos os Livros',
          href: '/livros',
        },
        {
          icon: <Bookmark className="w-4 h-4" />,
          label: 'Favoritos',
          href: '/livros/favoritos',
        },
        {
          icon: <Clock className="w-4 h-4" />,
          label: 'Recentes',
          href: '/livros/recentes',
        },
        {
          icon: <Star className="w-4 h-4" />,
          label: 'Populares',
          href: '/livros/populares',
        },
      ],
    },
    categorias: {
      title: 'Categorias',
      icon: <Folder className="w-5 h-5" />,
      items: [
        {
          icon: <Tag className="w-4 h-4" />,
          label: 'Tecnologia',
          href: '/categorias/tecnologia',
        },
        {
          icon: <Tag className="w-4 h-4" />,
          label: 'Ciência',
          href: '/categorias/ciencia',
        },
        {
          icon: <Tag className="w-4 h-4" />,
          label: 'Saúde',
          href: '/categorias/saude',
        },
        {
          icon: <Tag className="w-4 h-4" />,
          label: 'Educação',
          href: '/categorias/educacao',
        },
      ],
    },
    mangas: {
      title: 'Mangás',
      icon: <BookOpen className="w-5 h-5" />,
      items: [
        {
          icon: <BookOpenIcon className="w-4 h-4" />,
          label: 'Todos os Mangás',
          href: '/mangas',
        },
        {
          icon: <BookOpenCheckIcon className="w-4 h-4" />,
          label: 'Em Leitura',
          href: '/mangas/em-leitura',
        },
        {
          icon: <BookOpenTextIcon className="w-4 h-4" />,
          label: 'Finalizados',
          href: '/mangas/finalizados',
        },
        {
          icon: <Star className="w-4 h-4" />,
          label: 'Favoritos',
          href: '/mangas/favoritos',
        },
        {
          icon: <BarChart className="w-4 h-4" />,
          label: 'Estatísticas',
          href: '/mangas/estatisticas',
        },
      ],
    },
  };

  const mainMenuItems = [
    {
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: 'Dashboard',
      href: '/dashboard',
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Usuários',
      href: '/usuarios',
      requiresAuth: true,
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: 'Comentários',
      href: '/comentarios',
      requiresAuth: true,
      requiresAdmin: true,
    },
    {
      icon: <BarChart className="w-5 h-5" />,
      label: 'Estatísticas',
      href: '/estatisticas',
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Configurações',
      href: '/configuracoes',
      requiresAuth: true,
    },
  ];

  // Não renderizar a barra lateral, apenas retornar null
  return null;

      {isAuthenticated && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Link href="/perfil">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || 'Conectado'}
                  </p>
                </div>
              )}
              {!isCollapsed && (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </motion.div>
          </Link>
        </div>
      )}
    </motion.aside>
  );
}