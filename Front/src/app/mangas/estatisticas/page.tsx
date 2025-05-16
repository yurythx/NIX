'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Clock, Award, Eye, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import mangasService from '../../../services/api/mangas.service';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';

interface UserStats {
  id: number;
  username: string;
  total_chapters_read: number;
  total_pages_read: number;
  reading_time_minutes: number;
  last_updated: string;
}

interface LeaderboardEntry {
  id: number;
  username: string;
  total_chapters_read: number;
  total_pages_read: number;
  reading_time_minutes: number;
}

interface ViewHistoryEntry {
  id: number;
  manga: number;
  manga_title: string;
  view_count: number;
  last_viewed: string;
}

export default function EstatisticasPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();

  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [viewHistory, setViewHistory] = useState<ViewHistoryEntry[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/mangas/estatisticas');
    }
  }, [isAuthenticated, router]);

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);

        // Carregar estatísticas do usuário
        const stats = await mangasService.getUserStatistics();
        setUserStats(stats);

        // Carregar ranking
        const leaderboardData = await mangasService.getLeaderboard();
        setLeaderboard(leaderboardData);

        // Carregar histórico de visualizações
        const historyData = await mangasService.getViewHistory();
        setViewHistory(historyData);

        // Carregar recomendações
        const recommendationsData = await mangasService.getRecommendations();
        setRecommendations(recommendationsData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showNotification('Erro ao carregar estatísticas', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, showNotification]);

  // Formatar tempo de leitura
  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutos`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hora${hours > 1 ? 's' : ''}`;
    }

    return `${hours} hora${hours > 1 ? 's' : ''} e ${remainingMinutes} minuto${remainingMinutes > 1 ? 's' : ''}`;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/mangas" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1">
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Estatísticas de Leitura</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estatísticas do usuário */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              Suas Estatísticas
            </h2>

            {userStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                    <div className="text-indigo-600 dark:text-indigo-300 font-medium flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Capítulos Lidos
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {userStats.total_chapters_read}
                    </div>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                    <div className="text-indigo-600 dark:text-indigo-300 font-medium flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Páginas Lidas
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {userStats.total_pages_read}
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <div className="text-indigo-600 dark:text-indigo-300 font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Tempo de Leitura
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatReadingTime(userStats.reading_time_minutes)}
                  </div>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Última atualização: {new Date(userStats.last_updated).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Você ainda não tem estatísticas de leitura.</p>
                <p className="mt-2">Comece a ler mangás para gerar estatísticas!</p>
              </div>
            )}
          </div>

          {/* Ranking */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" />
              Ranking de Leitores
            </h2>

            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-lg flex items-center gap-3 ${
                      entry.username === userStats?.username
                        ? 'bg-indigo-100 dark:bg-indigo-900/30'
                        : 'bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-400 text-yellow-800' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-amber-600 text-amber-100' :
                      'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {entry.username}
                        {entry.username === userStats?.username && (
                          <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded">
                            Você
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {entry.total_chapters_read} capítulos • {entry.total_pages_read} páginas
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum leitor no ranking ainda.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Histórico de Visualizações */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-500" />
              Histórico de Visualizações
            </h2>

            {viewHistory.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {viewHistory.slice(0, 8).map(entry => (
                    <Link
                      href={`/mangas/${entry.manga}`}
                      key={entry.id}
                      className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white line-clamp-1">
                        {entry.manga_title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
                        <span>{entry.view_count} visualizações</span>
                        <span>{new Date(entry.last_viewed).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </Link>
                  ))}
                </div>

                {viewHistory.length > 8 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => router.push('/mangas/historico')}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Ver histórico completo
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Você ainda não visualizou nenhum mangá.</p>
                <Link
                  href="/mangas"
                  className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Explorar mangás
                </Link>
              </div>
            )}
          </div>

          {/* Recomendações */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Recomendações para Você
            </h2>

            {recommendations.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recommendations.map(manga => (
                  <Link
                    href={`/mangas/${manga.slug}`}
                    key={manga.id}
                    className="block group"
                  >
                    <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-2">
                      {manga.cover ? (
                        <img
                          src={manga.cover}
                          alt={manga.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                          <BookOpen className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 text-sm">
                      {manga.title}
                    </h3>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma recomendação disponível no momento.</p>
                <p className="mt-2">Continue lendo mangás para receber recomendações personalizadas!</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
