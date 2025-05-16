'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Star, Filter, Plus, Search, Clock, Tag, Edit, Eye, MessageSquare, TrendingUp, ChevronRight, Calendar, Trash2 } from 'lucide-react';
import Link from 'next/link';
import './styles/MangasPage.css';
import mangasService from '../../services/api/mangas.service';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getCategories } from '../../utils/categoryFallback';
import Pagination from '../../components/ui/Pagination';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import DeleteMangaButton from './components/DeleteMangaButton';

// Interface para os mangás com informações de exibição
interface DisplayManga {
  id: number;
  title: string;
  image: string;
  color: string;
  status: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  views_count?: number;
  comments_count?: number;
  author_id?: number;
  has_chapters?: boolean;
  featured?: boolean;
}

export default function MangasPage() {
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const { theme, themeColor } = useTheme();
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMangas, setTotalMangas] = useState(0);
  const [mangas, setMangas] = useState<DisplayManga[]>([]);

  // Estado para armazenar os mangás categorizados
  const [mangasData, setMangasData] = useState<{
    recentes: DisplayManga[];
    populares: DisplayManga[];
    destaques: DisplayManga[];
  }>({
    recentes: [],
    populares: [],
    destaques: []
  });

  // Estado para armazenar as categorias
  const [categories, setCategories] = useState<any[]>([]);

  // Função utilitária para categorizar mangás
  const categorizeMangas = (mangas: DisplayManga[]) => {
    if (!mangas || mangas.length === 0) {
      return {
        recentes: [],
        populares: [],
        destaques: []
      };
    }

    // Ordenar por data de criação (mais recentes primeiro)
    const recentes = [...mangas].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    }).slice(0, 6);

    // Ordenar por visualizações (mais populares primeiro)
    const populares = [...mangas].sort((a, b) => {
      const viewsA = a.views_count || 0;
      const viewsB = b.views_count || 0;
      return viewsB - viewsA;
    }).slice(0, 6);

    // Filtrar mangás em destaque ou usar os primeiros
    const destaques = mangas.filter(manga => manga.featured).length > 0
      ? mangas.filter(manga => manga.featured)
      : mangas.slice(0, 4);

    return {
      recentes,
      populares,
      destaques
    };
  };

  // Buscar mangás da API
  useEffect(() => {
    const fetchMangas = async () => {
      try {
        setIsLoading(true);

        // Buscar dados reais do backend
        const [paginatedData, categoriesData] = await Promise.all([
          mangasService.getPaginatedMangas(currentPage, searchQuery),
          getCategories() // Usar a versão com fallback
        ]);

        // Definir categorias do backend
        setCategories(categoriesData);

        // Caso não haja categorias, usar categorias padrão como fallback
        if (!categoriesData || categoriesData.length === 0) {
          console.log('Usando categorias padrão como fallback');
          const defaultCategories = [
            { id: 1, name: 'Ação', slug: 'acao' },
            { id: 2, name: 'Aventura', slug: 'aventura' },
            { id: 3, name: 'Comédia', slug: 'comedia' },
            { id: 4, name: 'Drama', slug: 'drama' },
            { id: 5, name: 'Fantasia', slug: 'fantasia' },
            { id: 6, name: 'Sci-Fi', slug: 'sci-fi' },
            { id: 7, name: 'Slice of Life', slug: 'slice-of-life' }
          ];
          setCategories(defaultCategories);
        }

        // Atualizar informações de paginação
        setTotalMangas(paginatedData.count);
        const pages = Math.ceil(paginatedData.count / 10); // Assumindo 10 itens por página
        setTotalPages(pages > 0 ? pages : 1);

        // Converter os mangás da API para o formato de exibição
        const formattedMangas: DisplayManga[] = paginatedData.results.map(manga => {
          // Gerar uma cor aleatória para cada mangá
          const color = `#${Math.floor(Math.random()*16777215).toString(16)}`;

          return {
            id: manga.id,
            title: manga.title,
            image: manga.cover || 'https://placehold.co/300x450?text=Sem+Capa',
            color: color,
            status: manga.status || 'Em andamento',
            slug: manga.slug,
            description: manga.description || '',
            created_at: manga.created_at,
            updated_at: manga.updated_at,
            category: manga.category,
            views_count: manga.views_count || 0,
            comments_count: manga.comments_count || 0,
            author_id: manga.author_id,
            has_chapters: manga.chapters && manga.chapters.length > 0,
            featured: manga.featured || false
          };
        });

        // Armazenar todos os mangás
        setMangas(formattedMangas);

        // Categorizar os mangás
        setMangasData(categorizeMangas(formattedMangas));

        setError(null);
      } catch (err: any) {
        console.error('Erro ao buscar mangás:', err);

        // Mensagem de erro mais específica baseada no tipo de erro
        let errorMessage = 'Não foi possível carregar os mangás. Por favor, tente novamente mais tarde.';
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
          errorMessage = 'Não encontramos os mangás solicitados. Tente mudar os filtros de busca.';
          notificationType = 'warning';
        }

        setError(errorMessage);
        showNotification(notificationType, errorMessage);

        // Dados de exemplo para desenvolvimento
        const mockMangas: DisplayManga[] = [
          {
            id: 1,
            title: 'Frieren: Beyond Journey\'s End',
            image: 'https://i.imgur.com/HWxOtcQ.jpeg',
            color: '#b0b6a9',
            status: 'Em andamento',
            slug: 'frieren',
            description: 'A história segue a maga elfa Frieren, que se junta a um grupo de heróis para derrotar o Rei Demônio.',
            created_at: '2023-08-15',
            updated_at: '2023-09-20',
            category: { id: 5, name: 'Fantasia', slug: 'fantasia' },
            views_count: 1200,
            comments_count: 45,
            has_chapters: true,
            featured: true
          },
          {
            id: 2,
            title: 'Dandadan',
            image: 'https://i.imgur.com/7FQ6L5j.jpeg',
            color: '#b47460',
            status: 'Em andamento',
            slug: 'dandadan',
            description: 'Uma história sobre adolescentes que lidam com o sobrenatural, alienígenas e fantasmas.',
            created_at: '2023-07-10',
            updated_at: '2023-09-15',
            category: { id: 1, name: 'Ação', slug: 'acao' },
            views_count: 980,
            comments_count: 32,
            has_chapters: true
          },
          {
            id: 9,
            title: 'My Broken Mariko',
            image: 'https://i.imgur.com/OS0VRhm.png',
            color: '#6e695e',
            status: 'Completo',
            slug: 'my-broken-mariko',
            description: 'Uma história emocionante sobre luto e amizade.',
            created_at: '2022-11-05',
            updated_at: '2023-01-20',
            category: { id: 4, name: 'Drama', slug: 'drama' },
            views_count: 750,
            comments_count: 28,
            has_chapters: true
          },
          {
            id: 12,
            title: 'BLAME!',
            image: 'https://i.imgur.com/yCBmW1b.png',
            color: '#7b4d35',
            status: 'Completo',
            slug: 'blame',
            description: 'Em um futuro distópico, um homem chamado Killy busca por genes Net Terminal para salvar a humanidade.',
            created_at: '2021-05-20',
            updated_at: '2022-08-10',
            category: { id: 6, name: 'Sci-Fi', slug: 'sci-fi' },
            views_count: 1500,
            comments_count: 60,
            has_chapters: true,
            featured: true
          }
        ];

        // Armazenar todos os mangás
        setMangas(mockMangas);

        // Categorizar os mangás
        setMangasData(categorizeMangas(mockMangas));

        setTotalPages(1);
        setTotalMangas(mockMangas.length);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMangas();
  }, [currentPage, searchQuery, showNotification]);

  // Função para lidar com a exclusão de um mangá
  const handleMangaDeleted = () => {
    // Recarregar os mangás
    const fetchMangas = async () => {
      try {
        setIsLoading(true);
        const [paginatedData, categoriesData] = await Promise.all([
          mangasService.getPaginatedMangas(currentPage, searchQuery),
          getCategories() // Buscar categorias atualizadas
        ]);

        // Atualizar as categorias
        if (categoriesData && categoriesData.length > 0) {
          setCategories(categoriesData);
        }

        // Converter os mangás da API para o formato de exibição
        const formattedMangas: DisplayManga[] = paginatedData.results.map(manga => {
          // Gerar uma cor aleatória para cada mangá
          const color = `#${Math.floor(Math.random()*16777215).toString(16)}`;

          return {
            id: manga.id,
            title: manga.title,
            image: manga.cover || 'https://placehold.co/300x450?text=Sem+Capa',
            color: color,
            status: manga.status || 'Em andamento',
            slug: manga.slug,
            description: manga.description || '',
            created_at: manga.created_at,
            updated_at: manga.updated_at,
            category: manga.category,
            views_count: manga.views_count || 0,
            comments_count: manga.comments_count || 0,
            author_id: manga.author_id,
            has_chapters: manga.chapters && manga.chapters.length > 0,
            featured: manga.featured || false
          };
        });

        // Armazenar todos os mangás
        setMangas(formattedMangas);

        // Categorizar os mangás
        setMangasData(categorizeMangas(formattedMangas));

        showNotification('success', 'Mangá excluído com sucesso!');
      } catch (err) {
        console.error('Erro ao recarregar mangás:', err);
        showNotification('warning', 'Não foi possível recarregar os mangás após a exclusão.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMangas();
  };

  // Função auxiliar para filtrar mangás por categoria
  const filterMangaByCategory = (manga: DisplayManga) => {
    if (filter === 'all') return true;

    // Verificar se o mangá tem categoria
    if (manga.category) {
      // Verificar pelo slug da categoria
      if (manga.category.slug && manga.category.slug.toLowerCase() === filter.toLowerCase()) {
        return true;
      }

      // Verificar pelo nome da categoria
      if (manga.category.name && manga.category.name.toLowerCase() === filter.toLowerCase()) {
        return true;
      }
    }

    return false;
  };

  // Aplicar filtro às categorias
  const filteredMangasData = {
    recentes: mangasData.recentes.filter(filterMangaByCategory),
    populares: mangasData.populares.filter(filterMangaByCategory),
    destaques: mangasData.destaques.filter(filterMangaByCategory)
  };

  // Função auxiliar para buscar mangás
  const searchManga = (manga: DisplayManga) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();

    // Buscar no título
    if (manga.title && manga.title.toLowerCase().includes(query)) {
      return true;
    }

    // Buscar na descrição
    if (manga.description && manga.description.toLowerCase().includes(query)) {
      return true;
    }

    // Buscar na categoria
    if (manga.category) {
      if (manga.category.name && manga.category.name.toLowerCase().includes(query)) {
        return true;
      }
    }

    return false;
  };

  // Aplicar busca às categorias filtradas
  const searchedMangasData = {
    recentes: filteredMangasData.recentes.filter(searchManga),
    populares: filteredMangasData.populares.filter(searchManga),
    destaques: filteredMangasData.destaques.filter(searchManga)
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Hero Section */}
      <motion.div
        className="mangas-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
        <div className="mangas-hero-content">
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-white mb-4 hero-element"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Biblioteca de <span className="text-pink-300">Mangás</span>
          </motion.h1>
          <motion.p
            className="text-lg text-purple-100 max-w-3xl mx-auto mb-6 hero-element"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Explore nossa coleção de mangás com histórias incríveis e arte deslumbrante.
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
                placeholder="Buscar mangás..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-600"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-600"
              >
                <option value="all">Todas as categorias</option>
                {categories && categories.length > 0 ? (
                  categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="acao">Ação</option>
                    <option value="aventura">Aventura</option>
                    <option value="comedia">Comédia</option>
                    <option value="drama">Drama</option>
                    <option value="fantasia">Fantasia</option>
                    <option value="sci-fi">Sci-Fi</option>
                    <option value="slice-of-life">Slice of Life</option>
                  </>
                )}
              </select>
            </div>
            {isAuthenticated && (
              <Link
                href="/mangas/novo"
                className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors cta-button"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Mangá
              </Link>
            )}
          </motion.div>
        </div>
      </motion.div>



      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Enquanto os mangás estão sendo carregados */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          {/* Seção de Mangás em Destaque */}
          {searchedMangasData.destaques.length > 0 && (
            <section className="mangas-section">
              <h2 className="section-title">
                <Star className="section-icon" />
                Mangás em Destaque
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchedMangasData.destaques.map((manga, index) => (
                  <motion.div
                    key={manga.id}
                    className="relative overflow-hidden rounded-xl shadow-lg group cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    onClick={() => window.location.href = `/mangas/${manga.slug}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/80 z-10"></div>
                    <div className="zoom-image-container h-80">
                      <img
                        src={manga.image || `https://source.unsplash.com/random/600x400?sig=${manga.id}&${manga.title}`}
                        alt={manga.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                      {manga.category && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white mb-3">
                          <Tag className="w-3 h-3 mr-1" />
                          {manga.category.name}
                        </span>
                      )}
                      <h2 className="text-2xl font-bold text-white mb-2">{manga.title}</h2>
                      <p className="text-gray-200 mb-4 line-clamp-2">{manga.description || 'Sem descrição disponível'}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-300">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(manga.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {manga.views_count || 0}
                          </span>
                          <span className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {manga.comments_count || 0}
                          </span>
                        </div>
                        <Link href={`/mangas/${manga.slug}`} className="text-white hover:text-purple-300 transition-colors">
                          Ler mais <ChevronRight className="w-4 h-4 inline" />
                        </Link>
                      </div>
                    </div>

                    {isAuthenticated && user && (
                      (user.is_superuser || (manga.author_id && String(user.id) === String(manga.author_id)))
                    ) && (
                      <div className="absolute top-2 right-2 flex space-x-2 z-30" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/mangas/${manga.slug}/editar`} className="p-2 bg-white/80 hover:bg-purple-600 hover:text-white rounded-full transition-colors">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <DeleteMangaButton
                          slug={manga.slug}
                          className="p-2 bg-white/80 hover:bg-red-600 hover:text-white rounded-full transition-colors"
                          showIcon={true}
                          buttonText=""
                          onDelete={handleMangaDeleted}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Seção de Mangás Recentes */}
          {searchedMangasData.recentes.length > 0 && (
            <section className="mangas-section">
              <h2 className="section-title">
                <Clock className="section-icon" />
                Mangás Recentes
              </h2>
              <div className="mangas-grid">
                {searchedMangasData.recentes.map((manga, index) => (
                  <motion.div
                    key={manga.id}
                    className="manga-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    style={{"--avarage-color": manga.color} as React.CSSProperties}
                    onClick={() => window.location.href = `/mangas/${manga.slug}`}
                  >
                    <div className="manga-image-container">
                      <img
                        src={manga.image || `https://source.unsplash.com/random/300x450?sig=${manga.id}&${manga.title}`}
                        alt={manga.title}
                        className="manga-image"
                      />
                    </div>
                    <div className="manga-content">
                      {manga.category && (
                        <span className="manga-category">
                          <Tag className="w-3 h-3 mr-1" /> {manga.category.name}
                        </span>
                      )}
                      <h3 className="manga-title">{manga.title}</h3>
                      <div className="manga-meta">
                        <div className="flex items-center space-x-2">
                          <span className="manga-meta-item">
                            <Calendar className="w-3 h-3" />
                            {new Date(manga.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="manga-meta-item">
                            <Eye className="w-3 h-3" />
                            {manga.views_count || 0}
                          </span>
                          <span className="manga-meta-item">
                            <MessageSquare className="w-3 h-3" />
                            {manga.comments_count || 0}
                          </span>
                        </div>
                        {isAuthenticated && user && (
                          (user.is_superuser || (manga.author_id && String(user.id) === String(manga.author_id)))
                        ) && (
                          <div className="flex items-center space-x-2">
                            <Link href={`/mangas/${manga.slug}/editar`} className="p-1 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400">
                              <Edit className="w-4 h-4" />
                            </Link>
                            <DeleteMangaButton
                              slug={manga.slug}
                              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                              showIcon={true}
                              buttonText=""
                              onDelete={handleMangaDeleted}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Seção de Mangás Populares */}
          {searchedMangasData.populares.length > 0 && (
            <section className="mangas-section">
              <h2 className="section-title">
                <TrendingUp className="section-icon" />
                Mangás Populares
              </h2>
              <div className="mangas-grid">
                {searchedMangasData.populares.map((manga, index) => (
                  <motion.div
                    key={manga.id}
                    className="manga-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    style={{"--avarage-color": manga.color} as React.CSSProperties}
                    onClick={() => window.location.href = `/mangas/${manga.slug}`}
                  >
                    <div className="manga-image-container">
                      <img
                        src={manga.image || `https://source.unsplash.com/random/300x450?sig=${manga.id}&${manga.title}`}
                        alt={manga.title}
                        className="manga-image"
                      />
                    </div>
                    <div className="manga-content">
                      {manga.category && (
                        <span className="manga-category">
                          <Tag className="w-3 h-3 mr-1" /> {manga.category.name}
                        </span>
                      )}
                      <h3 className="manga-title">{manga.title}</h3>
                      <div className="manga-meta">
                        <div className="flex items-center space-x-2">
                          <span className="manga-meta-item">
                            <Eye className="w-3 h-3" />
                            {manga.views_count || 0}
                          </span>
                          <span className="manga-meta-item">
                            <MessageSquare className="w-3 h-3" />
                            {manga.comments_count || 0}
                          </span>
                        </div>
                        {isAuthenticated && user && (
                          (user.is_superuser || (manga.author_id && String(user.id) === String(manga.author_id)))
                        ) && (
                          <div className="flex items-center space-x-2">
                            <Link href={`/mangas/${manga.slug}/editar`} className="p-1 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400">
                              <Edit className="w-4 h-4" />
                            </Link>
                            <DeleteMangaButton
                              slug={manga.slug}
                              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                              showIcon={true}
                              buttonText=""
                              onDelete={handleMangaDeleted}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Mensagem quando não há mangás */}
          {searchedMangasData.recentes.length === 0 &&
           searchedMangasData.populares.length === 0 &&
           searchedMangasData.destaques.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum mangá encontrado</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {searchQuery
                  ? `Não encontramos nenhum mangá correspondente a "${searchQuery}".`
                  : 'Não há mangás disponíveis no momento.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Limpar pesquisa
                </button>
              )}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}

          {/* Informações de paginação */}
          {totalMangas > 0 && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
              Mostrando página {currentPage} de {totalPages} ({totalMangas} mangás no total)
            </div>
          )}
        </>
      )}
    </div>
  );
}
