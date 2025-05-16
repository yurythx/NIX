'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Book, Calendar, Edit, Headphones, ArrowLeft, Bookmark, Eye, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import booksService, { Book as BookType } from '../../../services/api/books.service';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import DeleteBookButton from '../components/DeleteBookButton';
import { motion } from 'framer-motion';
import PageTransition from '../../../components/ui/PageTransition';
import BookDetailSkeleton from '../../../components/ui/skeletons/BookDetailSkeleton';
import UnifiedCommentList from '../../../components/comments/UnifiedCommentList';
import { ContentType } from '../../../services/api/unified-comments.service';
import FavoriteButton from '../../../components/ui/FavoriteButton';
import StarRating from '../../../components/ui/StarRating';
import LazyImage from '../../../components/ui/LazyImage';
import AudioPlayer from '../../../components/ui/AudioPlayer';
import PdfViewer from '../../../components/ui/PdfViewer';

export default function BookDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const [book, setBook] = useState<BookType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [audioBookmarks, setAudioBookmarks] = useState<number[]>([]);

  const [viewCount, setViewCount] = useState(0);

  const fetchBook = async () => {
    try {
      setIsLoading(true);
      const bookData = await booksService.getBookBySlug(slug as string);

      if (!bookData) {
        setError('Livro não encontrado');
        return;
      }

      setBook(bookData);
      setViewCount(bookData.views_count || 0);
      setError(null);

      // Incrementar visualizações
      try {
        // Usar o contador atual como valor inicial
        setViewCount(bookData.views_count || 0);

        // Tentar incrementar visualizações
        const viewsResult = await booksService.incrementViews(bookData.id, slug as string);

        // Se o backend retornou um contador atualizado, usar esse valor
        if (viewsResult && typeof viewsResult.views_count === 'number') {
          setViewCount(viewsResult.views_count);
        }
      } catch (viewErr) {
        // Em caso de erro, manter o contador atual
        console.error('Erro ao incrementar visualizações:', viewErr);
      }

      // Carregar marcadores salvos do localStorage
      const savedBookmarks = localStorage.getItem(`book_${bookData.id}_bookmarks`);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }

      const savedAudioBookmarks = localStorage.getItem(`book_${bookData.id}_audio_bookmarks`);
      if (savedAudioBookmarks) {
        setAudioBookmarks(JSON.parse(savedAudioBookmarks));
      }
    } catch (err: any) {
      console.error('Erro ao buscar livro:', err);
      setError('Não foi possível carregar o livro. Por favor, tente novamente mais tarde.');
      showNotification('error', 'Erro ao carregar livro');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchBook();
    }
  }, [slug]);

  useEffect(() => {
    // Inicializar o elemento de áudio se o livro tiver áudio
    if (book?.has_audio && book?.audio_file) {
      const audio = new Audio(book.audio_file);
      setAudioElement(audio);

      // Limpar o elemento de áudio quando o componente for desmontado
      return () => {
        audio.pause();
        audio.src = '';
      };
    }
  }, [book]);

  const toggleAudio = () => {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }

    setIsPlaying(!isPlaying);
  };

  // Adicionar marcador de página
  const addPageBookmark = (page: number) => {
    if (!book) return;

    const newBookmarks = [...bookmarks];
    if (!newBookmarks.includes(page)) {
      newBookmarks.push(page);
      setBookmarks(newBookmarks);
      localStorage.setItem(`book_${book.id}_bookmarks`, JSON.stringify(newBookmarks));
      showNotification('success', `Marcador adicionado na página ${page}`);
    }
  };

  // Adicionar marcador de áudio
  const addAudioBookmark = (time: number) => {
    if (!book) return;

    const newBookmarks = [...audioBookmarks];
    if (!newBookmarks.some(bookmark => Math.abs(bookmark - time) < 1)) {
      newBookmarks.push(time);
      setAudioBookmarks(newBookmarks);
      localStorage.setItem(`book_${book.id}_audio_bookmarks`, JSON.stringify(newBookmarks));
      showNotification('success', 'Marcador de áudio adicionado');
    }
  };

  // Atualizar página atual
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDelete = () => {
    router.push('/livros');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <BookDetailSkeleton />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg shadow-sm" role="alert">
          <span className="block sm:inline font-medium">{error || 'Livro não encontrado'}</span>
        </div>
        <div className="mt-6">
          <Link href="/livros" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a lista de livros
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/livros" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a lista de livros
          </Link>
        </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
        <div className="relative h-64 md:h-96 bg-gradient-to-r from-indigo-600 to-purple-600">
          {book.cover ? (
            <LazyImage
              src={book.cover}
              alt={book.title}
              className="w-full h-full"
              objectFit="cover"
              placeholderColor="#4f46e5"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Book className="w-24 h-24 text-white opacity-50" />
            </div>
          )}

          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
            <div className="p-6 w-full">
              <motion.h1
                className="text-3xl md:text-4xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {book.title}
              </motion.h1>

              <div className="flex flex-wrap items-center justify-between gap-4 text-white">
                <div className="flex flex-wrap items-center gap-4">
                  {book.category_name && (
                    <span className="inline-flex items-center text-sm">
                      <Book className="w-4 h-4 mr-1" />
                      {book.category_name}
                    </span>
                  )}

                  <span className="inline-flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(book.created_at).toLocaleDateString('pt-BR')}
                  </span>

                  <span className="inline-flex items-center text-sm">
                    <Eye className="w-4 h-4 mr-1" />
                    {viewCount} visualizações
                  </span>

                  <span className="inline-flex items-center text-sm">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {book.comments_count || 0}
                  </span>

                  {book.has_audio && (
                    <span className="inline-flex items-center text-sm bg-blue-600 px-2 py-1 rounded-full">
                      <Headphones className="w-4 h-4 mr-1" />
                      Áudio disponível
                    </span>
                  )}
                </div>

                <FavoriteButton
                  contentType="books.book"
                  objectId={book.id}
                  showText={true}
                  size="md"
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isAuthenticated && user && (
            (user.is_superuser || (book.author_id && String(user.id) === String(book.author_id)))
          ) && (
            <div className="flex gap-2 mb-6">
              <Link
                href={`/livros/${slug}/editar`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Link>

              <DeleteBookButton
                slug={slug as string}
                onDelete={handleDelete}
              />
            </div>
          )}

          {/* Visualizador de PDF */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">PDF do Livro</h2>
              <button
                onClick={() => addPageBookmark(currentPage)}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                title="Adicionar marcador na página atual"
              >
                <Bookmark className="w-4 h-4" />
                <span className="text-sm">Marcar página</span>
              </button>
            </div>

            {book.pdf_file ? (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <PdfViewer
                  pdfUrl={book.pdf_file}
                  initialPage={1}
                  onPageChange={handlePageChange}
                  className="min-h-[500px]"
                />

                {/* Lista de marcadores de página */}
                {bookmarks.length > 0 && (
                  <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Páginas marcadas</h3>
                    <div className="flex flex-wrap gap-2">
                      {bookmarks.map((page, index) => (
                        <button
                          key={index}
                          onClick={() => handlePageChange(page)}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 rounded"
                        >
                          Página {page}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 p-4 rounded-lg">
                PDF não disponível para este livro.
              </div>
            )}
          </div>

          {/* Player de áudio */}
          {book.has_audio && book.audio_file && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Áudio do Livro</h2>
              <AudioPlayer
                src={book.audio_file}
                title={`${book.title} - Audiolivro`}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onBookmark={addAudioBookmark}
                bookmarks={audioBookmarks}
              />
            </div>
          )}

          {/* Avaliação */}
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Avaliação</h2>
            <StarRating
              contentType="books.book"
              objectId={book.id}
              showSummary={true}
              size="md"
            />
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Descrição</h2>
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {book.description || 'Nenhuma descrição disponível para este livro.'}
            </div>
          </div>
        </div>
      </div>

      {/* Comentários */}
      <UnifiedCommentList
        contentType={ContentType.BOOK}
        contentId={slug as string}
        title="Comentários do Livro"
      />
      </div>
    </PageTransition>
  );
}
