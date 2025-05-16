'use client';

import { useState } from 'react';
import { LogIn, LogOut, User, UserPlus, Menu, BookOpen, BookType, Info, Mail, X, Book } from 'lucide-react';
import { useSidebar } from './SidebarProvider';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import ThemeSettings from './ThemeSettings';
import ThemeToggle from './ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  isAuthenticated: boolean;
  onToggleAuth: () => void;
}

export default function Navbar({ isAuthenticated, onToggleAuth }: NavbarProps) {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md flex justify-between items-center transition-all duration-300 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4 p-4">
        {isAuthenticated && (
          <motion.button
            onClick={toggleSidebar}
            className="hidden md:flex p-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700"
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="w-6 h-6" />
          </motion.button>
        )}
        <Link href="/" className="text-2xl font-semibold text-purple-600 dark:text-indigo-300 hover:opacity-80 transition-opacity">
          Projeto Prometheus
        </Link>
      </div>

      <div className="hidden md:flex items-center space-x-1">
        <Link
          href="/artigos"
          className="px-3 py-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center"
        >
          <BookOpen className="w-4 h-4 mr-1" />
          <span>Artigos</span>
        </Link>
        <Link
          href="/livros"
          className="px-3 py-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center"
        >
          <Book className="w-4 h-4 mr-1" />
          <span>Livros</span>
        </Link>
        <Link
          href="/mangas"
          className="px-3 py-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center"
        >
          <BookType className="w-4 h-4 mr-1" />
          <span>Mangás</span>
        </Link>
        <Link
          href="/sobre"
          className="px-3 py-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center"
        >
          <Info className="w-4 h-4 mr-1" />
          <span>Sobre</span>
        </Link>
        <Link
          href="/contato"
          className="px-3 py-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center"
        >
          <Mail className="w-4 h-4 mr-1" />
          <span>Contato</span>
        </Link>
      </div>

      {/* Menu móvel para telas pequenas */}
      <div className="md:hidden flex items-center">
        {isAuthenticated ? (
          <motion.button
            onClick={toggleSidebar}
            className="p-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700"
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="w-6 h-6" />
          </motion.button>
        ) : (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 p-4">
        <ThemeSettings />
        <ThemeToggle className="text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 hover:bg-purple-50 dark:hover:bg-gray-700" />

        {isAuthenticated ? (
          <>
            <Link
              href="/perfil"
              className="p-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700"
              title="Perfil"
            >
              <User className="w-6 h-6" />
            </Link>
            <button
              onClick={onToggleAuth}
              className="p-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700"
              title="Sair"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="p-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700"
              title="Entrar"
            >
              <LogIn className="w-6 h-6" />
            </Link>
            <Link
              href="/registro"
              className="p-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700"
              title="Registrar"
            >
              <UserPlus className="w-6 h-6" />
            </Link>
          </>
        )}
      </div>
      {/* Menu móvel dropdown (apenas para usuários não autenticados) */}
      <AnimatePresence>
        {mobileMenuOpen && !isAuthenticated && (
          <motion.div
            className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-50 border-b border-gray-200 dark:border-gray-700 md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col p-4 space-y-3">
              <Link
                href="/artigos"
                className="px-3 py-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                <span>Artigos</span>
              </Link>
              <Link
                href="/livros"
                className="px-3 py-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Book className="w-4 h-4 mr-2" />
                <span>Livros</span>
              </Link>
              <Link
                href="/mangas"
                className="px-3 py-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BookType className="w-4 h-4 mr-2" />
                <span>Mangás</span>
              </Link>
              <Link
                href="/sobre"
                className="px-3 py-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Info className="w-4 h-4 mr-2" />
                <span>Sobre</span>
              </Link>
              <Link
                href="/contato"
                className="px-3 py-2 text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Mail className="w-4 h-4 mr-2" />
                <span>Contato</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}