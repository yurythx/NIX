'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  BookOpen,
  Book,
  Eye,
  BarChart2,
  Users,
  Clock,
  TrendingUp,
  Calendar,
  Bookmark,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { statisticsService } from '../../services/api';
import type { GlobalStatistics } from '../../services/api/statistics.service';
import { useTheme } from '../../contexts/ThemeContext';

export default function StatisticsPage() {
  const [stats, setStats] = useState<GlobalStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await statisticsService.getGlobalStatistics();
        setStats(data);
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        setError('Não foi possível carregar as estatísticas. Usando dados simulados.');
        // Usar dados simulados em caso de erro
        const mockData = statisticsService.getMockStatistics();
        setStats(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Função para formatar números grandes
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Função para formatar data
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Preparar alerta de erro se houver
  const errorAlert = error ? (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-8">
      <div className="flex items-center">
        <AlertCircle className="h-6 w-6 text-yellow-400 mr-3" />
        <p className="text-yellow-700 dark:text-yellow-200">{error}</p>
      </div>
    </div>
  ) : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {errorAlert}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Estatísticas do NIX
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Visão geral de todos os conteúdos e atividades da plataforma
        </p>
        {stats && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Última atualização: {formatDate(stats.timestamp)}
          </p>
        )}
      </motion.div>

      {stats && (
        <>
          {/* Estatísticas gerais */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
              <BarChart2 className="mr-2" /> Visão Geral
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Total de Conteúdo</h3>
                  <Bookmark className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-4xl font-bold mb-2">{formatNumber(stats.general.total_content)}</p>
                <p className="text-indigo-100">Itens publicados</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Visualizações</h3>
                  <Eye className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-4xl font-bold mb-2">{formatNumber(stats.general.total_views)}</p>
                <p className="text-blue-100">Visualizações totais</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Usuários</h3>
                  <Users className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-4xl font-bold mb-2">{formatNumber(stats.users.total)}</p>
                <p className="text-emerald-100">{formatNumber(stats.users.active)} ativos nos últimos 30 dias</p>
              </motion.div>
            </div>
          </motion.section>

          {/* Estatísticas de artigos */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
              <FileText className="mr-2" /> Artigos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total de Artigos</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.articles.total}</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Visualizações</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.articles.views)}</p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                    <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Adicionados Recentemente</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.articles.recent}</p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                    <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Artigos Mais Visualizados</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {stats.articles.most_viewed.map((article, index) => (
                  <Link
                    href={`/artigos/${article.slug}`}
                    key={index}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-gray-500 dark:text-gray-400 w-8">{index + 1}.</span>
                      <span className="text-gray-900 dark:text-white font-medium">{article.title}</span>
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <Eye className="w-4 h-4 mr-1" />
                      {formatNumber(article.views_count)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Estatísticas de livros */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
              <Book className="mr-2" /> Livros
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total de Livros</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.books.total}</p>
                  </div>
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
                    <Book className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Visualizações</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.books.views)}</p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                    <Eye className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Adicionados Recentemente</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.books.recent}</p>
                  </div>
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full">
                    <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Livros Mais Visualizados</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {stats.books.most_viewed.map((book, index) => (
                  <Link
                    href={`/livros/${book.slug}`}
                    key={index}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-gray-500 dark:text-gray-400 w-8">{index + 1}.</span>
                      <span className="text-gray-900 dark:text-white font-medium">{book.title}</span>
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <Eye className="w-4 h-4 mr-1" />
                      {formatNumber(book.views_count)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Estatísticas de mangás */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
              <BookOpen className="mr-2" /> Mangás
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total de Mangás</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.mangas.total}</p>
                  </div>
                  <div className="bg-pink-100 dark:bg-pink-900/30 p-3 rounded-full">
                    <BookOpen className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Visualizações</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.mangas.views)}</p>
                  </div>
                  <div className="bg-cyan-100 dark:bg-cyan-900/30 p-3 rounded-full">
                    <Eye className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Capítulos</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.mangas.chapters}</p>
                  </div>
                  <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-full">
                    <Bookmark className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Adicionados Recentemente</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.mangas.recent}</p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
                    <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Mangás Mais Visualizados</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {stats.mangas.most_viewed.map((manga, index) => (
                  <Link
                    href={`/mangas/${manga.slug}`}
                    key={index}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-gray-500 dark:text-gray-400 w-8">{index + 1}.</span>
                      <span className="text-gray-900 dark:text-white font-medium">{manga.title}</span>
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <Eye className="w-4 h-4 mr-1" />
                      {formatNumber(manga.views_count)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.section>
        </>
      )}
    </div>
  );
}
