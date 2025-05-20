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

  return (
    <motion.aside
      initial={{ width: isCollapsed ? 80 : 280 }}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className={`h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed top-0 left-0 z-40 transition-colors duration-300 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <Link href="/" className="flex items-center">
          {!isCollapsed && (
            <span className="text-xl font-semibold text-gray-800 dark:text-white ml-2 transition-colors">
              NIX
            </span>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 transition-colors">
        <ul className="space-y-2">
          {mainMenuItems
            .filter(item => !item.requiresAuth || isAuthenticated)
            .filter(
              item => !item.requiresAdmin || (user && user.email === 'admin@example.com')
            )
            .map((item, index) => (
              <li key={index}>
                <Link
                  href={item.href}
                  className={`flex items-center p-2 rounded-lg ${
                    pathname === item.href
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  } transition-colors`}
                >
                  <div className="min-w-[28px]">{item.icon}</div>
                  {!isCollapsed && <span className="ml-3">{item.label}</span>}
                </Link>
              </li>
            ))}
        </ul>

        <div className="pt-4 mt-4 space-y-4 border-t border-gray-200 dark:border-gray-700 transition-colors">
          {Object.entries(menuItems).map(([key, section]) => (
            <SubMenu
              key={key}
              title={section.title}
              icon={section.icon}
              items={section.items}
              isCollapsed={isCollapsed}
              currentPath={pathname}
            />
          ))}
        </div>
      </div>

      {isAuthenticated && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 transition-colors">
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