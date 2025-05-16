'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Star, Clock, Calendar, User, Tag, ChevronDown, ChevronUp, Heart, Edit, Plus, MessageSquare, Eye } from 'lucide-react';
import Link from 'next/link';
import mangasService from '../../../services/api/mangas.service';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import UnifiedCommentList from '../../../components/comments/UnifiedCommentList';
import { ContentType } from '../../../services/api/unified-comments.service';
import DeleteMangaButton from '../components/DeleteMangaButton';
import { useRouter } from 'next/navigation';

export default function MangaDetailPage({ params }: { params: { slug: string } }) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();

  // Estado para armazenar os dados do mangá
  const [manga, setManga] = useState<{
    id: number;
    title: string;
    cover: string;
    author?: string;
    author_id?: number;
    genres?: string[];
    status?: string;
    rating?: number;
    chaptersCount?: number;
    description: string;
    publishedDate?: string;
    lastUpdated?: string;
    chapters: {
      id: number;
      number: number;
      title: string;
      date: string;
    }[];
  } | null>(null);

  // Buscar dados do mangá da API
  useEffect(() => {
    const fetchMangaData = async () => {
      try {
        setIsLoading(true);

        // Buscar o mangá pelo slug
        const mangaData = await mangasService.getMangaBySlug(params.slug);

        if (!mangaData) {
          setError('Mangá não encontrado');
          return;
        }

        // Verificar se o mangá está nos favoritos
        if (mangaData.is_favorite !== undefined) {
          setIsFavorite(mangaData.is_favorite);
        }

        // Buscar os capítulos do mangá
        const chaptersData = await mangasService.getChaptersByManga(params.slug);

        // Formatar os dados para exibição
        setManga({
          id: mangaData.id,
          title: mangaData.title,
          cover: mangaData.cover || 'https://placehold.co/300x450?text=Sem+Capa',
          description: mangaData.description || 'Sem descrição disponível',
          author: mangaData.author || 'Autor não especificado',
          author_id: mangaData.author_id,
          genres: mangaData.genres_list || ['Mangá'],
          status: mangaData.status_display || 'Em andamento',
          rating: 4.5, // Você pode adicionar um campo avaliação ao modelo Manga
          chaptersCount: chaptersData.length,
          publishedDate: new Date(mangaData.created_at).toLocaleDateString('pt-BR'),
          lastUpdated: new Date(mangaData.created_at).toLocaleDateString('pt-BR'),
          chapters: chaptersData.map(chapter => ({
            id: chapter.id,
            number: chapter.number,
            title: chapter.title,
            date: new Date(chapter.created_at).toLocaleDateString('pt-BR')
          })),
          readingProgress: mangaData.reading_progress
        });

        // Definir o contador de visualizações inicial
        setViewCount(mangaData.views_count || 0);

        // Incrementar visualizações
        try {
          // Tentar incrementar visualizações
          const viewsResult = await mangasService.incrementViews(mangaData.id, params.slug);

          // Se o backend retornou um contador atualizado, usar esse valor
          if (viewsResult && typeof viewsResult.views_count === 'number') {
            setViewCount(viewsResult.views_count);
          }
        } catch (viewError) {
          // Em caso de erro, manter o contador atual
          console.error('Erro ao incrementar visualizações:', viewError);
          // Não mostrar erro ao usuário, pois não é crítico
        }

        // Registrar visualização no histórico se o usuário estiver autenticado
        if (isAuthenticated) {
          try {
            await mangasService.recordMangaView(mangaData.id);
          } catch (error) {
            console.error('Erro ao registrar visualização no histórico:', error);
            // Não mostrar erro ao usuário, pois não é crítico
          }
        }

        setError(null);
      } catch (error) {
        console.error('Erro ao buscar dados do mangá:', error);
        setError('Não foi possível carregar os dados do mangá. Tente novamente mais tarde.');

        // Dados de fallback em caso de erro
        setManga({
          id: 1,
          title: 'Mangá não encontrado',
          cover: 'https://placehold.co/300x450?text=Não+Encontrado',
          description: 'Não foi possível carregar os dados deste mangá.',
          chapters: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMangaData();
  }, [params.slug, isAuthenticated]);

  // Função para alternar favorito
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      showNotification('Você precisa estar logado para favoritar mangás', 'warning');
      return;
    }

    try {
      setIsTogglingFavorite(true);
      await mangasService.toggleFavorite(params.slug);
      setIsFavorite(!isFavorite);
      showNotification(
        isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
        'success'
      );
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      showNotification('Erro ao alternar favorito', 'error');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/mangas" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1">
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : manga ? (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3 lg:w-1/4 bg-gray-200 dark:bg-gray-700 h-64 md:h-auto relative">
                {manga.cover ? (
                  <img
                    src={manga.cover}
                    alt={`Capa de ${manga.title}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <BookOpen className="w-16 h-16" />
                  </div>
                )}
              </div>
              <div className="p-6 md:w-2/3 lg:w-3/4">
                <div className="flex justify-between items-start">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{manga.title}</h1>
                  <div className="flex gap-2">
                    {isAuthenticated && user && (
                      (user.is_superuser || (manga.author_id && String(user.id) === String(manga.author_id)))
                    ) && (
                      <>
                        <Link
                          href={`/mangas/${params.slug}/editar`}
                          className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <DeleteMangaButton
                          slug={params.slug}
                          className="p-2 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300"
                          showIcon={true}
                          buttonText=""
                          onDelete={() => router.push('/mangas')}
                        />
                      </>
                    )}
                    <button
                      onClick={handleToggleFavorite}
                      disabled={isTogglingFavorite}
                      className={`p-2 rounded-full ${
                        isFavorite
                          ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      } ${isTogglingFavorite ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Progresso de leitura */}
                {manga.readingProgress && (
                  <div className="mt-2 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-sm">
                    <p className="text-indigo-700 dark:text-indigo-300">
                      Você está lendo o <strong>Capítulo {manga.readingProgress.chapter}</strong>
                      {manga.readingProgress.page && (
                        <span> (Página {manga.readingProgress.page})</span>
                      )}
                      <Link
                        href={`/mangas/${params.slug}/chapters/${manga.readingProgress.chapter}`}
                        className="ml-2 underline"
                      >
                        Continuar lendo
                      </Link>
                    </p>
                  </div>
                )}

                {manga.rating && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="font-medium">{manga.rating}</span>
                    </div>
                    {manga.status && (
                      <>
                        <span className="text-gray-500 dark:text-gray-400">•</span>
                        <span className="text-gray-600 dark:text-gray-300">{manga.status}</span>
                      </>
                    )}
                    {manga.chaptersCount !== undefined && (
                      <>
                        <span className="text-gray-500 dark:text-gray-400">•</span>
                        <span className="text-gray-600 dark:text-gray-300">{manga.chaptersCount} capítulos</span>
                      </>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {manga.author && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <span>Autor: <span className="font-medium">{manga.author}</span></span>
                    </div>
                  )}
                  {manga.publishedDate && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <span>Publicado: <span className="font-medium">{manga.publishedDate}</span></span>
                    </div>
                  )}
                  {manga.lastUpdated && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <span>Última atualização: <span className="font-medium">{manga.lastUpdated}</span></span>
                    </div>
                  )}
                  {manga.genres && manga.genres.length > 0 && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Tag className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <span>Gêneros: <span className="font-medium">{manga.genres.join(', ')}</span></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Eye className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span>Visualizações: <span className="font-medium">{viewCount}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span>Comentários: <span className="font-medium">{manga.comments_count || 0}</span></span>
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Sinopse</h2>
                  <div className="relative">
                    <p className={`text-gray-600 dark:text-gray-300 ${!showFullDescription && 'line-clamp-3'}`}>
                      {manga.description}
                    </p>
                    {manga.description.length > 200 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                      >
                        {showFullDescription ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            <span>Mostrar menos</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            <span>Mostrar mais</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Capítulos</h2>
              {isAuthenticated && user && (
                (user.is_superuser || (manga.author_id && String(user.id) === String(manga.author_id)))
              ) && (
                <Link
                  href={`/mangas/${params.slug}/chapters/novo`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg flex items-center gap-1 text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Novo Capítulo
                </Link>
              )}
            </div>

            {manga.chapters.length > 0 ? (
              <div className="space-y-2">
                {manga.chapters.map((chapter) => (
                  <Link
                    href={`/mangas/${params.slug}/chapters/${chapter.number}`}
                    key={chapter.id}
                    className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900 dark:text-white">Capítulo {chapter.number}</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-300">{chapter.title}</span>
                        {chapter.chapter_type === 'pdf' && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                            PDF
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{chapter.date}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum capítulo disponível</p>
                {isAuthenticated && user && (
                  (user.is_superuser || (manga.author_id && String(user.id) === String(manga.author_id)))
                ) && (
                  <Link
                    href={`/mangas/${params.slug}/chapters/novo`}
                    className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Adicionar o primeiro capítulo
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Seção de comentários */}
          <div className="mt-8">
            <UnifiedCommentList
              contentType={ContentType.MANGA}
              contentId={params.slug}
              title="Comentários do Mangá"
            />
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mangá não encontrado</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">O mangá que você está procurando não existe ou foi removido.</p>
          <Link
            href="/mangas"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Voltar para a lista de mangás
          </Link>
        </div>
      )}
    </div>
  );
}
