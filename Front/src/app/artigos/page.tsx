'use client';

import { useEffect, useState } from 'react';
import { FileText, Filter, Clock, Tag, Plus, Edit, Eye, MessageSquare, Search, Star, TrendingUp, ChevronRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Article } from '../../types/models';
import * as articlesService from '../../services/api/articles.service';
import { getCategories } from '../../utils/categoryFallback';
import { useAuth } from '../../contexts/AuthContext';
import Pagination from '../../components/ui/Pagination';
import { useNotification } from '../../contexts/NotificationContext';
import DeleteArticleButton from './components/DeleteArticleButton';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import './styles/ArticlesPage.css';

// Componente de card de artigo em destaque
const FeaturedArticleCard = ({ article, index, isAuthenticated, user, onDelete }: {
  article: Article,
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
      onClick={() => window.location.href = `/artigos/${article.slug}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/80 z-10"></div>
      <div className="zoom-image-container h-80">
        <img
          src={article.cover_image || article.image || `https://source.unsplash.com/random/600x400?sig=${article.id}&${article.title}`}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
        {article.category && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white mb-3">
            <Tag className="w-3 h-3 mr-1" />
            {article.category.name}
          </span>
        )}
        <h2 className="text-2xl font-bold text-white mb-2">{article.title}</h2>
        <p className="text-gray-200 mb-4 line-clamp-2">{article.content ? article.content.replace(/<[^>]*>/g, '').substring(0, 150) : 'Sem conteúdo disponível'}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-300">
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {new Date(article.created_at).toLocaleDateString('pt-BR')}
            </span>
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {article.views_count || 0}
            </span>
            <span className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-1" />
              {article.comments_count || 0}
            </span>
          </div>
          <Link href={`/artigos/${article.slug}`} className="text-white hover:text-blue-300 transition-colors">
            Ler mais <ChevronRight className="w-4 h-4 inline" />
          </Link>
        </div>
      </div>

      {isAuthenticated && user && (
        (user.is_superuser || (article.author_id && String(user.id) === String(article.author_id)))
      ) && (
        <div className="absolute top-2 right-2 flex space-x-2 z-30" onClick={(e) => e.stopPropagation()}>
          <Link href={`/artigos/${article.slug}/editar`} className="p-2 bg-white/80 hover:bg-indigo-600 hover:text-white rounded-full transition-colors">
            <Edit className="w-4 h-4" />
          </Link>
          <DeleteArticleButton
            slug={article.slug}
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

// Componente de card de artigo regular
const ArticleCard = ({ article, index, isAuthenticated, user, onDelete }: {
  article: Article,
  index: number,
  isAuthenticated: boolean,
  user: any,
  onDelete: () => void
}) => {
  return (
    <motion.div
      className="article-card relative cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={() => window.location.href = `/artigos/${article.slug}`}
    >
      <div className="article-image-container">
        <img
          src={article.cover_image || article.image || `https://source.unsplash.com/random/600x400?sig=${article.id}&${article.title}`}
          alt={article.title}
          className="article-image"
        />
        {article.featured && (
          <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Destaque
          </span>
        )}
      </div>
      <div className="article-content">
        {article.category && (
          <span className="article-category">
            <Tag className="w-3 h-3 mr-1" /> {article.category.name}
          </span>
        )}
        <h3 className="article-title">{article.title}</h3>
        <p className="article-excerpt">{article.content ? article.content.replace(/<[^>]*>/g, '').substring(0, 120) : 'Sem conteúdo disponível'}...</p>
        <div className="article-meta">
          <div className="flex items-center space-x-3">
            <span className="article-meta-item">
              <Calendar className="w-3 h-3" />
              {new Date(article.created_at).toLocaleDateString('pt-BR')}
            </span>
            <span className="article-meta-item">
              <Eye className="w-3 h-3" />
              {article.views_count || 0}
            </span>
            <span className="article-meta-item">
              <MessageSquare className="w-3 h-3" />
              {article.comments_count || 0}
            </span>
          </div>
          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
            {isAuthenticated && user && (
              (user.is_superuser || (article.author_id && String(user.id) === String(article.author_id)))
            ) && (
              <>
                <Link href={`/artigos/${article.slug}/editar`} className="p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400">
                  <Edit className="w-4 h-4" />
                </Link>
                <DeleteArticleButton
                  slug={article.slug}
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

export default function ArtigosPage() {
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const { theme, themeColor } = useTheme();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);

  // Estado para armazenar os artigos categorizados
  const [articlesData, setArticlesData] = useState<{
    recentes: Article[];
    populares: Article[];
    destaques: Article[];
  }>({
    recentes: [],
    populares: [],
    destaques: []
  });

  // Estado para armazenar as categorias
  const [categories, setCategories] = useState<any[]>([]);

  // Buscar artigos da API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true);

        // Buscar dados reais do backend
        const [paginatedData, featuredArticles, popularArticles, recentArticles, categoriesData] = await Promise.all([
          articlesService.getPaginatedArticles(currentPage),
          articlesService.getFeaturedArticles(),
          articlesService.getPopularArticles(),
          articlesService.getRecentArticles(),
          getCategories() // Usar a versão com fallback
        ]);

        // Definir categorias do backend
        setCategories(categoriesData);

        // Caso não haja categorias, usar categorias padrão como fallback
        if (!categoriesData || categoriesData.length === 0) {
          console.log('Usando categorias padrão como fallback');
          const defaultCategories = [
            { id: 1, name: 'Tecnologia', slug: 'tecnologia' },
            { id: 2, name: 'Programação', slug: 'programacao' },
            { id: 3, name: 'Design', slug: 'design' },
            { id: 4, name: 'Mangá', slug: 'manga' },
            { id: 5, name: 'Cultura', slug: 'cultura' },
            { id: 6, name: 'Anime', slug: 'anime' },
            { id: 7, name: 'Games', slug: 'games' }
          ];
          setCategories(defaultCategories);
        }

        const articlesResult = paginatedData.results;
        setArticles(articlesResult);
        setTotalArticles(paginatedData.count);

        // Calcular o número total de páginas
        const pages = Math.ceil(paginatedData.count / 10); // Assumindo 10 itens por página
        setTotalPages(pages > 0 ? pages : 1);

        // Usar os dados categorizados do backend
        setArticlesData({
          recentes: recentArticles,
          populares: popularArticles,
          destaques: featuredArticles
        });

        setError(null);
      } catch (err: any) {
        console.error('Erro ao buscar artigos:', err);
        const errorMessage = 'Não foi possível carregar os artigos. Por favor, tente novamente mais tarde.';
        setError(errorMessage);
        showNotification('error', errorMessage);

        // Dados de exemplo para desenvolvimento
        const mockArticles = [
          {
            id: 1,
            title: 'Como Criar um Blog com Next.js',
            slug: 'como-criar-um-blog-com-nextjs',
            content: 'Um guia completo para criar um blog moderno usando Next.js, Tailwind CSS e TypeScript.',
            created_at: '2023-08-15',
            comments: [],
            comments_count: 0,
            views_count: 120,
            color: '#6366f1'
          },
          // ... outros artigos de exemplo
        ];

        setArticles(mockArticles);

        // Categorizar os artigos de exemplo
        setArticlesData({
          recentes: mockArticles.slice(0, 3),
          populares: mockArticles.slice(3, 6),
          destaques: mockArticles.slice(0, 4)
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, [currentPage, showNotification]);

  // Função para mudar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Função para lidar com a exclusão de um artigo
  const handleArticleDeleted = () => {
    // Recarregar os artigos
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        const [paginatedData, featuredArticles, popularArticles, recentArticles, categoriesData] = await Promise.all([
          articlesService.getPaginatedArticles(currentPage),
          articlesService.getFeaturedArticles(),
          articlesService.getPopularArticles(),
          articlesService.getRecentArticles(),
          getCategories() // Buscar categorias atualizadas
        ]);

        // Atualizar as categorias
        if (categoriesData && categoriesData.length > 0) {
          setCategories(categoriesData);
        }
        setArticles(paginatedData.results);
        setTotalArticles(paginatedData.count);

        // Atualizar os artigos categorizados
        setArticlesData({
          recentes: recentArticles,
          populares: popularArticles,
          destaques: featuredArticles
        });

        showNotification('success', 'Artigo excluído com sucesso!');
      } catch (err) {
        console.error('Erro ao recarregar artigos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  };

  // Função auxiliar para filtrar artigos por categoria
  const filterArticleByCategory = (article: any) => {
    if (filter === 'all') return true;

    // Verificar se o artigo tem categoria
    if (article.category) {
      // Verificar pelo slug da categoria
      if (article.category.slug && article.category.slug.toLowerCase() === filter.toLowerCase()) {
        return true;
      }

      // Verificar pelo nome da categoria
      if (article.category.name && article.category.name.toLowerCase() === filter.toLowerCase()) {
        return true;
      }
    }

    // Verificar se o título ou conteúdo contém a palavra-chave do filtro
    if (article.title && article.title.toLowerCase().includes(filter.toLowerCase())) {
      return true;
    }

    if (article.content && article.content.toLowerCase().includes(filter.toLowerCase())) {
      return true;
    }

    return false;
  };

  // Aplicar filtro às categorias
  const filteredArticlesData = {
    recentes: articlesData.recentes.filter(filterArticleByCategory),
    populares: articlesData.populares.filter(filterArticleByCategory),
    destaques: articlesData.destaques.filter(filterArticleByCategory)
  };

  // Função auxiliar para buscar artigos
  const searchArticle = (article: any) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();

    // Buscar no título
    if (article.title && article.title.toLowerCase().includes(query)) {
      return true;
    }

    // Buscar no conteúdo
    if (article.content && article.content.toLowerCase().includes(query)) {
      return true;
    }

    // Buscar na categoria
    if (article.category) {
      if (article.category.name && article.category.name.toLowerCase().includes(query)) {
        return true;
      }

      if (article.category.slug && article.category.slug.toLowerCase().includes(query)) {
        return true;
      }
    }

    // Buscar no autor
    if (article.author) {
      if ((article.author as any).username && (article.author as any).username.toLowerCase().includes(query)) {
        return true;
      }

      if ((article.author as any).name && (article.author as any).name.toLowerCase().includes(query)) {
        return true;
      }
    }

    return false;
  };

  // Aplicar busca às categorias filtradas
  const searchedArticlesData = {
    recentes: filteredArticlesData.recentes.filter(searchArticle),
    populares: filteredArticlesData.populares.filter(searchArticle),
    destaques: filteredArticlesData.destaques.filter(searchArticle)
  };

  // Para compatibilidade com o código existente
  const filteredArticles = Array.isArray(articles) ? articles.filter(filterArticleByCategory) : [];

  // Enquanto os artigos estão sendo carregados
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Hero Section */}
      <motion.div
        className="articles-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
        <div className="articles-hero-content">
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-white mb-4 hero-element"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Biblioteca de <span className="text-yellow-300">Artigos</span>
          </motion.h1>
          <motion.p
            className="text-lg text-indigo-100 max-w-3xl mx-auto mb-6 hero-element"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Explore nossa coleção de artigos sobre desenvolvimento, design, tecnologia e muito mais.
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
                placeholder="Buscar artigos..."
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
                  if (searchQuery) {
                    setSearchQuery('');
                  }
                }}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600"
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
                    <option value="tecnologia">Tecnologia</option>
                    <option value="programação">Programação</option>
                    <option value="design">Design</option>
                    <option value="mangá">Mangá</option>
                    <option value="cultura">Cultura</option>
                    <option value="anime">Anime</option>
                    <option value="games">Games</option>
                  </>
                )}
              </select>
            </div>
            {isAuthenticated && (
              <Link
                href="/artigos/novo"
                className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors cta-button"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Artigo
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

      {/* Artigos Recentes */}
      {searchedArticlesData.recentes.length > 0 && (
        <section className="articles-section">
          <div className="flex items-center justify-between mb-6">
            <motion.h2
              className="section-title"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Clock className="section-icon w-6 h-6 text-green-500" />
              Artigos Recentes
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

          <div className="articles-grid">
            {searchedArticlesData.recentes.slice(0, 6).map((article, index) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={index}
                isAuthenticated={isAuthenticated}
                user={user}
                onDelete={handleArticleDeleted}
              />
            ))}
          </div>
        </section>
      )}

      {/* Artigos em Destaque */}
      {searchedArticlesData.destaques.length > 0 && (
        <section className="articles-section">
          <div className="flex items-center justify-between mb-6">
            <motion.h2
              className="section-title"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Star className="section-icon w-6 h-6 text-yellow-500" />
              Artigos em Destaque
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
            {searchedArticlesData.destaques.slice(0, 4).map((article, index) => (
              <FeaturedArticleCard
                key={article.id}
                article={article}
                index={index}
                isAuthenticated={isAuthenticated}
                user={user}
                onDelete={handleArticleDeleted}
              />
            ))}
          </div>
        </section>
      )}

      {/* Artigos Populares */}
      {searchedArticlesData.populares.length > 0 && (
        <section className="articles-section">
          <div className="flex items-center justify-between mb-6">
            <motion.h2
              className="section-title"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <TrendingUp className="section-icon w-6 h-6 text-blue-500" />
              Artigos Populares
            </motion.h2>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <button onClick={() => setFilter('all')} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center">
                Ver todos <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </motion.div>
          </div>

          <div className="articles-grid">
            {searchedArticlesData.populares.slice(0, 6).map((article, index) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={index}
                isAuthenticated={isAuthenticated}
                user={user}
                onDelete={handleArticleDeleted}
              />
            ))}
          </div>
        </section>
      )}

      {/* Se não houver artigos em nenhuma categoria após a filtragem */}
      {searchedArticlesData.recentes.length === 0 &&
       searchedArticlesData.populares.length === 0 &&
       searchedArticlesData.destaques.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum artigo encontrado.</p>
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
            <h3 className="text-xl font-semibold">Total de Artigos</h3>
            <FileText className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-4xl font-bold mb-2">{totalArticles}+</p>
          <p className="text-blue-100">Artigos publicados</p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-lg stats-card"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Visualizações</h3>
            <Eye className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-4xl font-bold mb-2">
            {articles.reduce((total, article) => total + (article.views_count || 0), 0)}+
          </p>
          <p className="text-purple-100">Visualizações totais</p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg stats-card"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Comentários</h3>
            <MessageSquare className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-4xl font-bold mb-2">
            {articles.reduce((total, article) => total + (article.comments_count || 0), 0)}+
          </p>
          <p className="text-emerald-100">Comentários feitos</p>
        </motion.div>
      </motion.section>

      {/* Informação sobre total de artigos */}
      <div className="text-center mb-4 text-sm text-gray-500 dark:text-gray-400">
        {filter !== 'all' || searchQuery ? (
          <span>
            Mostrando {filteredArticles.length} artigos filtrados de {totalArticles} no total
          </span>
        ) : (
          <span>
            Mostrando {articles.length} de {totalArticles} artigos
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
  );
}
