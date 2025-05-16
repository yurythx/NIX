'use client';

import { useEffect, useState } from 'react';
import { Book, Headphones, Filter, Plus, Edit, Eye, Search, Star, TrendingUp, ChevronRight, Calendar, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import booksService, { Book as BookType } from '../../services/api/books.service';
import { getCategories } from '../../utils/categoryFallback';
import { useAuth } from '../../contexts/AuthContext';
import Pagination from '../../components/ui/Pagination';
import { useNotification } from '../../contexts/NotificationContext';
import DeleteBookButton from './components/DeleteBookButton';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import BookCardSkeleton from '../../components/ui/skeletons/BookCardSkeleton';
import PageTransition from '../../components/ui/PageTransition';
import './styles/BooksPage.css';

// Componente de card de livro em destaque
const FeaturedBookCard = ({ book, index, isAuthenticated, user, onDelete }: {
  book: BookType,
  index: number,
  isAuthenticated: boolean,
  user: any,
  onDelete: () => void
}) => {
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl shadow-lg group cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={() => window.location.href = `/livros/${book.slug}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/80 z-10"></div>
      <div className="zoom-image-container h-80">
        <img
          src={book.cover || `https://source.unsplash.com/random/600x400?book&sig=${book.id}`}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
        {book.category_name && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white mb-3">
            <Book className="w-3 h-3 mr-1" />
            {book.category_name}
          </span>
        )}
        <h2 className="text-2xl font-bold text-white mb-2">{book.title}</h2>
        <p className="text-gray-200 mb-4 line-clamp-2">{book.description ? book.description.substring(0, 150) : 'Sem descrição disponível'}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-300">
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(book.created_at).toLocaleDateString('pt-BR')}
            </span>
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {book.views_count || 0}
            </span>
            <span className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-1" />
              {book.comments_count || 0}
            </span>
            {book.has_audio && (
              <span className="flex items-center">
                <Headphones className="w-4 h-4 mr-1" />
                Áudio
              </span>
            )}
          </div>
          <Link href={`/livros/${book.slug}`} className="text-white hover:text-blue-300 transition-colors">
            Ler mais <ChevronRight className="w-4 h-4 inline" />
          </Link>
        </div>
      </div>

      {isAuthenticated && user && (
        (user.is_superuser || (book.author_id && String(user.id) === String(book.author_id)))
      ) && (
        <div className="absolute top-2 right-2 flex space-x-2 z-30" onClick={(e) => e.stopPropagation()}>
          <Link href={`/livros/${book.slug}/editar`} className="p-2 bg-white/80 hover:bg-indigo-600 hover:text-white rounded-full transition-colors">
            <Edit className="w-4 h-4" />
          </Link>
          <DeleteBookButton
            slug={book.slug}
            className="p-2 bg-white/80 hover:bg-red-600 hover:text-white rounded-full transition-colors"
            showIcon={true}
            buttonText=""
            onDelete={onDelete}
          />
        </div>
      )}
    </motion.div>
  );
};

// Componente de card de livro regular
const BookCard = ({ book, index, isAuthenticated, user, onDelete }: {
  book: BookType,
  index: number,
  isAuthenticated: boolean,
  user: any,
  onDelete: () => void
}) => {
  return (
    <motion.div
      className="book-card relative cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={() => window.location.href = `/livros/${book.slug}`}
    >
      <div className="book-image-container">
        <img
          src={book.cover || `https://source.unsplash.com/random/600x400?book&sig=${book.id}`}
          alt={book.title}
          className="book-image"
        />
        {book.has_audio && (
          <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
            <Headphones className="w-3 h-3 mr-1" /> Áudio
          </span>
        )}
      </div>
      <div className="book-content">
        {book.category_name && (
          <span className="book-category">
            <Book className="w-3 h-3 mr-1" /> {book.category_name}
          </span>
        )}
        <h3 className="book-title">{book.title}</h3>
        <p className="book-excerpt">{book.description ? book.description.substring(0, 120) : 'Sem descrição disponível'}...</p>
        <div className="book-meta">
          <div className="flex items-center space-x-2">
            <span className="book-meta-item">
              <Calendar className="w-3 h-3" />
              {new Date(book.created_at).toLocaleDateString('pt-BR')}
            </span>
            <span className="book-meta-item">
              <Eye className="w-3 h-3" />
              {book.views_count || 0}
            </span>
            <span className="book-meta-item">
              <MessageSquare className="w-3 h-3" />
              {book.comments_count || 0}
            </span>
          </div>
          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
            {isAuthenticated && user && (
              (user.is_superuser || (book.author_id && String(user.id) === String(book.author_id)))
            ) && (
              <>
                <Link href={`/livros/${book.slug}/editar`} className="p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400">
                  <Edit className="w-4 h-4" />
                </Link>
                <DeleteBookButton
                  slug={book.slug}
                  className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  showIcon={true}
                  buttonText=""
                  onDelete={onDelete}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Função utilitária para categorizar livros
const categorizeBooks = (books: BookType[]) => {
  console.log('Categorizando livros, entrada:', books);

  // Verificar se books é um array válido
  if (!books || !Array.isArray(books) || books.length === 0) {
    console.log('Array de livros vazio ou inválido');
    return {
      recentes: [],
      comAudio: [],
      destaques: []
    };
  }

  // Ordenar por data de criação (mais recentes primeiro)
  const recentes = [...books].sort((a, b) => {
    // Verificar se as datas são válidas
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  }).slice(0, 6);

  // Filtrar livros com áudio
  const comAudio = books.filter(book => book && book.has_audio === true);

  // Para destaques, usar os primeiros livros
  // Em uma implementação real, poderia haver um campo 'featured' no modelo
  const destaques = books.slice(0, 4);

  const result = {
    recentes,
    comAudio,
    destaques
  };

  console.log('Resultado da categorização:', result);
  return result;
};

/**
 * Função utilitária para processar livros no cliente
 * Filtra, ordena e pagina os livros com base nos parâmetros fornecidos
 */
const processClientSideBooks = (
  allBooks: BookType[],
  page: number,
  search: string,
  audioFilter?: boolean
) => {
  // Filtrar os livros
  let filteredResults = [...allBooks];

  // Aplicar filtro de pesquisa
  if (search) {
    const query = search.toLowerCase();
    filteredResults = filteredResults.filter(book =>
      (book.title && book.title.toLowerCase().includes(query)) ||
      (book.description && book.description.toLowerCase().includes(query)) ||
      (book.category_name && book.category_name.toLowerCase().includes(query))
    );
  }

  // Aplicar filtro de áudio
  if (audioFilter !== undefined) {
    filteredResults = filteredResults.filter(book => book.has_audio === audioFilter);
  }

  // Ordenar por data de criação (mais recentes primeiro)
  filteredResults.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Calcular paginação
  const totalItems = filteredResults.length;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  return {
    books: paginatedResults,
    totalItems,
    totalPages: totalPages > 0 ? totalPages : 1
  };
};

export default function LivrosPage() {
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const { theme, themeColor } = useTheme();
  const [books, setBooks] = useState<BookType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [hasAudioFilter, setHasAudioFilter] = useState<boolean | undefined>(undefined);

  // Estado para armazenar os livros categorizados
  const [booksData, setBooksData] = useState<{
    recentes: BookType[];
    comAudio: BookType[];
    destaques: BookType[];
  }>({
    recentes: [],
    comAudio: [],
    destaques: []
  });

  // Estado para armazenar as categorias
  const [categories, setCategories] = useState<any[]>([
    { id: 1, name: 'Tecnologia', slug: 'tecnologia', description: 'Artigos sobre tecnologia, programação e desenvolvimento de software.' },
    { id: 2, name: 'Mangás', slug: 'mangas', description: 'Mangás e quadrinhos japoneses.' },
    { id: 3, name: 'Livros', slug: 'livros', description: 'Livros, e-books e publicações literárias.' },
    { id: 4, name: 'Tutoriais', slug: 'tutoriais', description: 'Guias e tutoriais sobre diversos assuntos.' },
    { id: 5, name: 'Notícias', slug: 'noticias', description: 'Notícias e atualizações sobre diversos temas.' },
    { id: 6, name: 'Entretenimento', slug: 'entretenimento', description: 'Conteúdo de entretenimento, jogos, filmes e séries.' }
  ]);

  // Buscar livros da API
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setIsLoading(true);

        // Buscar dados reais do backend
        try {
          // Buscar dados paginados
          const paginatedData = await booksService.getPaginatedBooks(currentPage, searchQuery, hasAudioFilter, '-created_at');

          // Não precisamos mais buscar categorias, pois estamos usando categorias estáticas

          // Categorias já foram armazenadas acima

          // Usar os dados paginados da API
          const booksResult = paginatedData.results;
          setBooks(booksResult);
          setTotalBooks(paginatedData.count);

          // Calcular o número total de páginas
          const pages = Math.ceil(paginatedData.count / 10); // Assumindo 10 itens por página
          setTotalPages(pages > 0 ? pages : 1);

          // Categorizar os livros e atualizar o estado booksData
          console.log('Livros carregados da API:', booksResult);
          const categorizedBooks = categorizeBooks(booksResult);
          console.log('Livros categorizados:', categorizedBooks);
          setBooksData(categorizedBooks);
        } catch (error) {
          console.error('Erro ao buscar livros paginados:', error);

          // Fallback para paginação no cliente se a API falhar
          console.log('Usando fallback para paginação no cliente...');

          // Buscar todos os livros
          const allBooks = await booksService.getBooks();

          // Usar a função utilitária para processar os livros no cliente
          const { books: paginatedResults, totalItems, totalPages: calculatedPages } =
            processClientSideBooks(allBooks, currentPage, searchQuery, hasAudioFilter);

          // Atualizar estados
          setBooks(paginatedResults);
          setTotalBooks(totalItems);
          setTotalPages(calculatedPages);

          // Categorizar os livros usando a função utilitária
          setBooksData(categorizeBooks(paginatedResults));
        }

        setError(null);
      } catch (err: any) {
        console.error('Erro ao buscar livros:', err);

        // Mensagem de erro mais específica baseada no tipo de erro
        let errorMessage = 'Não foi possível carregar os livros. Por favor, tente novamente mais tarde.';
        let notificationType: 'success' | 'error' | 'warning' | 'info' = 'error';

        if (err.message) {
          if (err.message.includes('network') || err.message.includes('fetch')) {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          } else if (err.message.includes('timeout')) {
            errorMessage = 'A requisição demorou muito. Tente novamente mais tarde.';
          } else if (err.message.includes('permission') || err.message.includes('401') || err.message.includes('403')) {
            errorMessage = 'Você não tem permissão para acessar estes dados.';
          }
        }

        // Se o erro for relacionado a um problema de servidor, mostrar mensagem específica
        if (err.status === 500) {
          errorMessage = 'Erro no servidor. Nossa equipe foi notificada e está trabalhando na solução.';
        } else if (err.status === 404) {
          errorMessage = 'Não encontramos os livros solicitados. Tente mudar os filtros de busca.';
          notificationType = 'warning';
        }

        setError(errorMessage);
        showNotification(notificationType, errorMessage);

        // Dados de exemplo para desenvolvimento
        const mockBooks: BookType[] = [
          {
            id: 1,
            title: 'O Guia do Mochileiro das Galáxias',
            slug: 'guia-mochileiro-galaxias',
            description: 'Um guia essencial para quem deseja viajar pela galáxia economizando dinheiro.',
            created_at: '2023-08-15',
            updated_at: '2023-08-15', // Adicionado para satisfazer a interface BookType
            has_audio: true,
            cover: null,
            category: 1,
            category_name: 'Ficção Científica'
          },
          // ... outros livros de exemplo
        ];

        setBooks(mockBooks);

        // Categorizar os livros de exemplo usando a função utilitária
        setBooksData(categorizeBooks(mockBooks));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [currentPage, searchQuery, hasAudioFilter, showNotification]);

  // Função para mudar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Função para lidar com a exclusão de um livro
  const handleBookDeleted = () => {
    // Recarregar os livros
    const fetchBooks = async () => {
      try {
        setIsLoading(true);
        try {
          // Buscar dados paginados
          const paginatedData = await booksService.getPaginatedBooks(currentPage, searchQuery, hasAudioFilter, '-created_at');

          // Não precisamos mais buscar categorias, pois estamos usando categorias estáticas

          const booksResult = paginatedData.results;
          setBooks(booksResult);
          setTotalBooks(paginatedData.count);

          // Categorias já foram atualizadas acima

          // Calcular o número total de páginas
          const pages = Math.ceil(paginatedData.count / 10);
          setTotalPages(pages > 0 ? pages : 1);

          // Atualizar os dados categorizados usando a função utilitária
          setBooksData(categorizeBooks(booksResult));
        } catch (error) {
          console.error('Erro ao buscar livros paginados após exclusão:', error);

          // Fallback para paginação no cliente
          console.log('Usando fallback para paginação no cliente após exclusão...');

          // Buscar todos os livros
          const allBooks = await booksService.getBooks();

          // Usar a função utilitária para processar os livros no cliente
          const { books: paginatedResults, totalItems, totalPages: calculatedPages } =
            processClientSideBooks(allBooks, currentPage, searchQuery, hasAudioFilter);

          // Atualizar estados
          setBooks(paginatedResults);
          setTotalBooks(totalItems);
          setTotalPages(calculatedPages);

          // Categorizar os livros usando a função utilitária
          setBooksData(categorizeBooks(paginatedResults));
        }

        showNotification('success', 'Livro excluído com sucesso!');
      } catch (err: any) {
        console.error('Erro ao recarregar livros após exclusão:', err);

        // Mensagem de erro mais específica baseada no tipo de erro
        let errorMessage = 'Não foi possível recarregar os livros após a exclusão.';
        let notificationType: 'success' | 'error' | 'warning' | 'info' = 'warning'; // Usar warning porque o livro provavelmente foi excluído

        if (err.message) {
          if (err.message.includes('network') || err.message.includes('fetch')) {
            errorMessage = 'Erro de conexão ao recarregar livros. Atualize a página manualmente.';
          }
        }

        showNotification(notificationType, errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  };

  // Função auxiliar para filtrar livros por categoria
  const filterBookByCategory = (book: BookType) => {
    if (filter === 'all') return true;
    if (filter === 'audio' && book.has_audio) return true;

    // Verificar se o livro tem categoria
    if (book.category_name && book.category_name.toLowerCase() === filter.toLowerCase()) {
      return true;
    }

    // Verificar se o título ou descrição contém a palavra-chave do filtro
    if (book.title && book.title.toLowerCase().includes(filter.toLowerCase())) {
      return true;
    }

    if (book.description && book.description.toLowerCase().includes(filter.toLowerCase())) {
      return true;
    }

    return false;
  };

  // Aplicar filtro às categorias
  const filteredBooksData = {
    recentes: booksData.recentes.filter(filterBookByCategory),
    comAudio: booksData.comAudio.filter(filterBookByCategory),
    destaques: booksData.destaques.filter(filterBookByCategory)
  };

  // Função auxiliar para buscar livros
  const searchBook = (book: BookType) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();

    // Buscar no título
    if (book.title && book.title.toLowerCase().includes(query)) {
      return true;
    }

    // Buscar na descrição
    if (book.description && book.description.toLowerCase().includes(query)) {
      return true;
    }

    // Buscar na categoria
    if (book.category_name && book.category_name.toLowerCase().includes(query)) {
      return true;
    }

    return false;
  };

  // Aplicar busca às categorias filtradas
  const searchedBooksData = {
    recentes: filteredBooksData.recentes.filter(searchBook),
    comAudio: filteredBooksData.comAudio.filter(searchBook),
    destaques: filteredBooksData.destaques.filter(searchBook)
  };

  // Log para depuração
  console.log('Estado final para renderização:', {
    booksData,
    filteredBooksData,
    searchedBooksData,
    books: books.length,
    totalBooks
  });

  // Para compatibilidade com o código existente
  const filteredBooks = Array.isArray(books) ? books.filter(filterBookByCategory) : [];

  // Enquanto os livros estão sendo carregados
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section Skeleton */}
        <div className="books-hero animate-pulse">
          <div className="books-hero-content">
            <div className="h-10 w-64 bg-white/20 rounded-lg mx-auto mb-4"></div>
            <div className="h-6 w-full max-w-3xl bg-white/20 rounded-lg mx-auto mb-6"></div>
            <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-4">
              <div className="h-12 w-full bg-white/20 rounded-lg"></div>
              <div className="h-12 w-full md:w-48 bg-white/20 rounded-lg"></div>
              <div className="h-12 w-full md:w-40 bg-white/20 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Books Grid Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-5 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>

          <div className="books-grid">
            {Array(6).fill(0).map((_, index) => (
              <BookCardSkeleton key={index} />
            ))}
          </div>
        </div>

        {/* Featured Books Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-5 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array(4).fill(0).map((_, index) => (
              <div key={index} className="relative h-80 rounded-xl bg-gray-300 dark:bg-gray-700"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
      <motion.div
        className="books-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
        <div className="books-hero-content">
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-white mb-4 hero-element"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Biblioteca de <span className="text-yellow-300">Livros</span>
          </motion.h1>
          <motion.p
            className="text-lg text-indigo-100 max-w-3xl mx-auto mb-6 hero-element"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Explore nossa coleção de livros sobre diversos temas, incluindo opções com áudio.
          </motion.p>

          {/* Filtros e Pesquisa */}
          <motion.div
            className="max-w-3xl mx-auto flex flex-col md:flex-row gap-4 hero-element"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar livros..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  if (e.target.value === 'audio') {
                    setHasAudioFilter(true);
                  } else {
                    setHasAudioFilter(undefined);
                  }
                  if (searchQuery) {
                    setSearchQuery('');
                  }
                }}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600"
              >
                <option value="all">Todas as categorias</option>
                <option value="audio">Com áudio</option>
                {categories && categories.length > 0 ? (
                  categories.map((category) => (
                    <option key={category.id} value={category.name.toLowerCase()}>
                      {category.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="ficção">Ficção</option>
                    <option value="não-ficção">Não-Ficção</option>
                    <option value="romance">Romance</option>
                    <option value="fantasia">Fantasia</option>
                    <option value="história">História</option>
                  </>
                )}
              </select>
            </div>
            {isAuthenticated && (
              <Link
                href="/livros/novo"
                className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors cta-button"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Livro
              </Link>
            )}
          </motion.div>
        </div>
      </motion.div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg shadow-sm" role="alert">
          <span className="block sm:inline font-medium">{error}</span>
        </div>
      )}

      {/* Livros Recentes */}
      {searchedBooksData.recentes.length > 0 && (
        <section className="books-section">
          <div className="flex items-center justify-between mb-6">
            <motion.h2
              className="section-title"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Calendar className="section-icon w-6 h-6 text-green-500" />
              Livros Recentes
            </motion.h2>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <button onClick={() => setFilter('all')} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center">
                Ver todos <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </motion.div>
          </div>

          <div className="books-grid">
            {searchedBooksData.recentes.slice(0, 6).map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                index={index}
                isAuthenticated={isAuthenticated}
                user={user}
                onDelete={handleBookDeleted}
              />
            ))}
          </div>
        </section>
      )}

      {/* Livros em Destaque */}
      {searchedBooksData.destaques.length > 0 && (
        <section className="books-section">
          <div className="flex items-center justify-between mb-6">
            <motion.h2
              className="section-title"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Star className="section-icon w-6 h-6 text-yellow-500" />
              Livros em Destaque
            </motion.h2>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <button onClick={() => setFilter('all')} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center">
                Ver todos <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {searchedBooksData.destaques.slice(0, 4).map((book, index) => (
              <FeaturedBookCard
                key={book.id}
                book={book}
                index={index}
                isAuthenticated={isAuthenticated}
                user={user}
                onDelete={handleBookDeleted}
              />
            ))}
          </div>
        </section>
      )}

      {/* Livros com Áudio */}
      {searchedBooksData.comAudio.length > 0 && (
        <section className="books-section">
          <div className="flex items-center justify-between mb-6">
            <motion.h2
              className="section-title"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Headphones className="section-icon w-6 h-6 text-blue-500" />
              Livros com Áudio
            </motion.h2>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <button onClick={() => setFilter('audio')} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center">
                Ver todos <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </motion.div>
          </div>

          <div className="books-grid">
            {searchedBooksData.comAudio.slice(0, 6).map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                index={index}
                isAuthenticated={isAuthenticated}
                user={user}
                onDelete={handleBookDeleted}
              />
            ))}
          </div>
        </section>
      )}

      {/* Se não houver livros em nenhuma categoria após a filtragem */}
      {searchedBooksData.recentes.length === 0 &&
       searchedBooksData.comAudio.length === 0 &&
       searchedBooksData.destaques.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum livro encontrado.</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Tente ajustar os filtros ou a busca.</p>
        </div>
      )}

      {/* Estatísticas */}
      <motion.section
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <motion.div
          className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg stats-card"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Total de Livros</h3>
            <Book className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-4xl font-bold mb-2">{totalBooks}+</p>
          <p className="text-blue-100">Livros publicados</p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-lg stats-card"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Livros com Áudio</h3>
            <Headphones className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-4xl font-bold mb-2">
            {books.filter(book => book.has_audio).length}+
          </p>
          <p className="text-purple-100">Audiolivros disponíveis</p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg stats-card"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Categorias</h3>
            <Filter className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-4xl font-bold mb-2">
            {categories.length}+
          </p>
          <p className="text-emerald-100">Categorias disponíveis</p>
        </motion.div>
      </motion.section>

      {/* Informação sobre total de livros */}
      <div className="text-center mb-4 text-sm text-gray-500 dark:text-gray-400">
        {filter !== 'all' || searchQuery ? (
          <span>
            Mostrando {filteredBooks.length} livros filtrados de {totalBooks} no total
          </span>
        ) : (
          <span>
            Mostrando {books.length} de {totalBooks} livros
          </span>
        )}
      </div>

      {/* Paginação */}
      <div className="pagination">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
      </div>
    </PageTransition>
  );
}
