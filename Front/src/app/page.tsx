'use client';

// app/page.tsx
import { useState, useEffect } from 'react';
import { Plus, FileText, BookOpen, TrendingUp, Star, Clock, ChevronRight, Search, Tag, Eye, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import * as articlesService from '../services/api/articles.service';
import './styles/HomePage.css';
import './artigos/styles/ArticlesPage.css';
import BackendConnectionTest from '@/components/common/BackendConnectionTest';

// Tipos para os artigos e estatísticas
interface ArticleStats {
  totalArticles: number;
  totalViews: number;
  totalCategories: number;
}

// Componente de card de artigo em destaque
const FeaturedArticleCard = ({ article, index }: { article: any, index: number }) => {
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl shadow-lg group featured-card cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={() => window.location.href = `/artigos/${article.slug || article.id}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/80 z-10"></div>
      <div className="zoom-image-container">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-80 object-cover zoom-image"
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white mb-3">
          <Tag className="w-3 h-3 mr-1" />
          {article.category}
        </span>
        <h2 className="text-2xl font-bold text-white mb-2">{article.title}</h2>
        <p className="text-gray-200 mb-4 line-clamp-2">{article.excerpt}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-300">
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {article.readTime} min
            </span>
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {article.views}
            </span>
            <span className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-1" />
              {article.comments}
            </span>
          </div>
          <div className="text-white hover:text-blue-300 transition-colors">
            Ler mais <ChevronRight className="w-4 h-4 inline" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Componente de card de artigo recente
const RecentArticleCard = ({ article, index }: { article: any, index: number }) => {
  return (
    <motion.div
      className="article-card relative cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={() => window.location.href = `/artigos/${article.slug || article.id}`}
    >
      <div className="article-image-container">
        <img
          src={article.image}
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
        <span className="article-category">
          <Tag className="w-3 h-3 mr-1" /> {article.category}
        </span>
        <h3 className="article-title">{article.title}</h3>
        <p className="article-excerpt">{article.excerpt}</p>
        <div className="article-meta">
          <div className="flex items-center space-x-3">
            <span className="article-meta-item">
              <Clock className="w-3 h-3" />
              {article.readTime} min
            </span>
            <span className="article-meta-item">
              <Eye className="w-3 h-3" />
              {article.views}
            </span>
            <span className="article-meta-item">
              <MessageSquare className="w-3 h-3" />
              {article.comments}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Home() {
  const { theme, themeColor } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para armazenar os artigos
  const [featuredArticles, setFeaturedArticles] = useState<any[]>([]);
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const [popularArticles, setPopularArticles] = useState<any[]>([]);
  const [stats, setStats] = useState<ArticleStats>({
    totalArticles: 0,
    totalViews: 0,
    totalCategories: 0
  });

  // Buscar dados do backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Buscar dados reais do backend
        const [featuredData, recentData, popularData] = await Promise.all([
          articlesService.getFeaturedArticles(),
          articlesService.getRecentArticles(),
          articlesService.getPopularArticles()
        ]);

        // Processar os artigos para o formato esperado pelos componentes
        const processArticles = (articles: any[]) => {
          return articles.map(article => ({
            id: article.id,
            title: article.title,
            excerpt: article.content ? article.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 'Sem conteúdo disponível',
            image: article.cover_image || article.image || `https://source.unsplash.com/random/600x400?sig=${article.id}&${article.title}`,
            category: article.category ? article.category.name : 'Geral',
            readTime: Math.ceil((article.content?.length || 0) / 1000), // Estimativa de tempo de leitura
            views: article.views_count || 0,
            comments: article.comments_count || 0,
            slug: article.slug,
            color: article.color || '#4f46e5'
          }));
        };

        // Atualizar os estados com os dados processados
        setFeaturedArticles(processArticles(featuredData));
        setRecentArticles(processArticles(recentData));
        setPopularArticles(processArticles(popularData));

        // Calcular estatísticas
        const allArticles = [...featuredData, ...recentData, ...popularData];
        const uniqueArticles = Array.from(new Set(allArticles.map(a => a.id)));
        const uniqueCategories = Array.from(new Set(allArticles.filter(a => a.category).map(a => a.category.id)));

        setStats({
          totalArticles: uniqueArticles.length,
          totalViews: allArticles.reduce((total, article) => total + (article.views_count || 0), 0),
          totalCategories: uniqueCategories.length
        });

        setError(null);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Não foi possível carregar os dados. Por favor, tente novamente mais tarde.');

        // Dados de exemplo para desenvolvimento em caso de erro
        const mockFeaturedArticles = [
          {
            id: 1,
            title: 'Como Criar um Blog com Next.js',
            excerpt: 'Um guia completo para criar um blog moderno usando Next.js, Tailwind CSS e TypeScript.',
            image: 'https://source.unsplash.com/random/600x400?nextjs',
            category: 'Desenvolvimento Web',
            readTime: 5,
            views: 1250,
            comments: 24,
            slug: 'como-criar-um-blog-com-nextjs',
            color: '#4f46e5'
          },
          {
            id: 2,
            title: 'Introdução ao TypeScript',
            excerpt: 'Aprenda os conceitos básicos do TypeScript e como ele pode melhorar seu desenvolvimento.',
            image: 'https://source.unsplash.com/random/600x400?typescript',
            category: 'Programação',
            readTime: 8,
            views: 980,
            comments: 15,
            slug: 'introducao-ao-typescript',
            color: '#8b5cf6'
          },
          {
            id: 3,
            title: 'Tailwind CSS: Guia Definitivo',
            excerpt: 'Domine o Tailwind CSS e crie interfaces modernas com facilidade.',
            image: 'https://source.unsplash.com/random/600x400?css',
            category: 'Design',
            readTime: 6,
            views: 1540,
            comments: 32,
            slug: 'tailwind-css-guia-definitivo',
            color: '#10b981'
          },
          {
            id: 4,
            title: 'React Hooks Avançados',
            excerpt: 'Aprenda a usar os hooks mais avançados do React para criar aplicações poderosas.',
            image: 'https://source.unsplash.com/random/600x400?react',
            category: 'React',
            readTime: 10,
            views: 2100,
            comments: 45,
            slug: 'react-hooks-avancados',
            color: '#ef4444'
          }
        ];

        const mockRecentArticles = [
          {
            id: 5,
            title: 'Otimização de Performance em React',
            excerpt: 'Técnicas avançadas para melhorar a performance de suas aplicações React.',
            image: 'https://source.unsplash.com/random/600x400?performance',
            category: 'React',
            readTime: 7,
            views: 850,
            comments: 12,
            slug: 'otimizacao-de-performance-em-react',
            color: '#f97316'
          },
          {
            id: 6,
            title: 'Introdução ao GraphQL',
            excerpt: 'Aprenda como usar GraphQL para criar APIs mais eficientes e flexíveis.',
            image: 'https://source.unsplash.com/random/600x400?api',
            category: 'Backend',
            readTime: 9,
            views: 1120,
            comments: 18,
            slug: 'introducao-ao-graphql',
            color: '#06b6d4'
          }
        ];

        setFeaturedArticles(mockFeaturedArticles);
        setRecentArticles(mockRecentArticles);
        setPopularArticles(mockFeaturedArticles.slice(0, 2));

        setStats({
          totalArticles: 120,
          totalViews: 25000,
          totalCategories: 15
        });
      } finally {
        setIsLoading(false);
        // Simular carregamento para mostrar as animações
        setIsLoaded(true);
      }
    };

    fetchData();
  }, []);

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
    <div className="space-y-12 pb-12">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg shadow-sm" role="alert">
          <span className="block sm:inline font-medium">{error}</span>
        </div>
      )}

      {/* Teste de conexão com o backend */}
      <div className="mb-8">
        <BackendConnectionTest />
      </div>

      {/* Hero Section */}
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-700 dark:to-purple-800 animated-gradient"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
        <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-24 text-center">
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 hero-element"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Explore o Mundo dos <span className="text-yellow-300">Artigos</span>
          </motion.h1>
          <motion.p
            className="text-xl text-indigo-100 max-w-3xl mx-auto mb-8 hero-element"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Descubra conteúdo de qualidade sobre desenvolvimento, design, tecnologia e muito mais.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center hero-element"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/artigos" className="px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg hover:bg-gray-100 transition-colors">
              Explorar Artigos
            </Link>
            <Link href="/artigos/novo" className="px-6 py-3 bg-indigo-700 text-white font-medium rounded-lg hover:bg-indigo-800 transition-colors cta-button">
              <Plus className="w-5 h-5 inline mr-2" />
              Novo Artigo
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Barra de pesquisa */}
      <motion.div
        className="max-w-3xl mx-auto px-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600"
            placeholder="Pesquisar artigos..."
          />
        </div>
      </motion.div>

      {/* Artigos em Destaque */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center section-title"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Star className="w-6 h-6 mr-2 text-yellow-500" />
            Artigos em Destaque
          </motion.h2>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/artigos" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center">
              Ver todos <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredArticles.slice(0, 4).map((article, index) => (
            <FeaturedArticleCard key={article.id} article={article} index={index} />
          ))}
        </div>
      </section>

      {/* Artigos Recentes */}
      <section className="articles-section">
        <div className="flex items-center justify-between mb-6">
          <motion.h2
            className="section-title"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Clock className="section-icon w-6 h-6 text-green-500" />
            Artigos Recentes
          </motion.h2>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/artigos" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center">
              Ver todos <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </motion.div>
        </div>

        <div className="articles-grid">
          {recentArticles.map((article, index) => (
            <RecentArticleCard key={article.id} article={article} index={index} />
          ))}
        </div>
      </section>

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
          <p className="text-4xl font-bold mb-2">{stats.totalArticles}+</p>
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
            {stats.totalViews > 1000
              ? `${Math.floor(stats.totalViews / 1000)}K+`
              : `${stats.totalViews}+`}
          </p>
          <p className="text-purple-100">Visualizações totais</p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg stats-card"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Categorias</h3>
            <Tag className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-4xl font-bold mb-2">{stats.totalCategories}+</p>
          <p className="text-emerald-100">Categorias disponíveis</p>
        </motion.div>
      </motion.section>

      {/* Call to Action */}
      <motion.section
        className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-8 md:p-12 text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        whileInView={{ scale: 1.01 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 section-title">Pronto para compartilhar seu conhecimento?</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Junte-se à nossa comunidade de escritores e compartilhe seus conhecimentos com o mundo.
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/artigos/novo" className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors cta-button">
            <Plus className="w-5 h-5 mr-2" />
            Criar Novo Artigo
          </Link>
        </motion.div>
      </motion.section>
    </div>
  );
}