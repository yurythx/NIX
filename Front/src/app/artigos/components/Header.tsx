'use client';

import Link from 'next/link';
import { Search, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar funcionalidade de busca
    console.log('Buscando por:', searchQuery);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/artigos" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Viixen Artigos</span>
            </Link>
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <Link href="/artigos" className="text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 text-sm font-medium">
                Todos
              </Link>
              <Link href="/artigos/tecnologia" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 text-sm font-medium">
                Tecnologia
              </Link>
              <Link href="/artigos/manga" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 text-sm font-medium">
                Mangá
              </Link>
              <Link href="/artigos/cultura" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 text-sm font-medium">
                Cultura
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar artigos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </form>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden ml-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Abrir menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/artigos" className="text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 block px-3 py-2 rounded-md text-base font-medium">
              Todos
            </Link>
            <Link href="/artigos/tecnologia" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 block px-3 py-2 rounded-md text-base font-medium">
              Tecnologia
            </Link>
            <Link href="/artigos/manga" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 block px-3 py-2 rounded-md text-base font-medium">
              Mangá
            </Link>
            <Link href="/artigos/cultura" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 block px-3 py-2 rounded-md text-base font-medium">
              Cultura
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSearch} className="px-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar artigos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
