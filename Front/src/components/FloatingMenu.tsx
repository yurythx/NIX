'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown,
  Book,
  X,
} from 'lucide-react';
import { useSidebar } from './SidebarProvider';

interface FloatingMenuProps {
  isAuthenticated?: boolean;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function FloatingMenu({
  isAuthenticated = false,
  user,
}: FloatingMenuProps) {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  if (isCollapsed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -300 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-50"
        onClick={toggleSidebar}
      >
        <motion.div
          className="absolute top-0 left-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              Projeto Prometheus
            </h1>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </button>
          </div>

          <nav className="p-4 space-y-6">
            <div className="space-y-2">
              {mainMenuItems.map((item, idx) => {
                // Verificar permissões
                if (item.requiresAuth && !isAuthenticated) return null;
                if (item.requiresAdmin && (!user || !(user as any).is_staff)) return null;

                return (
                  <Link key={idx} href={item.href} onClick={toggleSidebar}>
                    <div
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        pathname === item.href
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-indigo-500 dark:text-indigo-400">
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="space-y-4">
              {Object.entries(menuItems).map(([key, menu]) => (
                <div key={key} className="space-y-2">
                  <div
                    className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => toggleSection(key)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-indigo-500 dark:text-indigo-400">
                        {menu.icon}
                      </span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {menu.title}
                      </span>
                    </div>
                    <span>
                      {expandedSection === key ? (
                        <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      )}
                    </span>
                  </div>

                  <AnimatePresence>
                    {expandedSection === key && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-10 space-y-2"
                      >
                        {menu.items.map((item, idx) => (
                          <Link key={idx} href={item.href} onClick={toggleSidebar}>
                            <div
                              className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                                pathname === item.href
                                  ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                              }`}
                            >
                              <span className="text-indigo-500 dark:text-indigo-400">
                                {item.icon}
                              </span>
                              <span>{item.label}</span>
                            </div>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </nav>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
