'use client';

import React, { useEffect, useState } from 'react';
import { Article } from '../../../types/article.types';
import * as articlesService from '../../../services/api/articles.service';
import { ArrowLeft, Calendar, Edit, Tag, User, Eye, Heart, Share2, Bookmark, BookmarkCheck, MessageSquare, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UnifiedCommentList from '../../../components/comments/UnifiedCommentList';
import { ContentType } from '../../../services/api/unified-comments.service';
import DeleteArticleButton from '../components/DeleteArticleButton';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import ArticleMeta from '../../../components/seo/ArticleMeta';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/ArticleDetailPage.css';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const fetchArticle = async () => {
    try {
      setIsLoading(true);
      const data = await articlesService.getArticleBySlug(params.slug);

      if (data) {
        setArticle(data);
        setViewCount(data.views_count || 0);
        setError(null);

        // Incrementar visualizações
        try {
          const viewsResult = await articlesService.incrementViews(data.id, params.slug);
          if (viewsResult && viewsResult.views_count) {
            setViewCount(viewsResult.views_count);
          }
        } catch (viewErr) {
          console.error('Erro ao incrementar visualizações:', viewErr);
        }
      } else {
        setArticle(null);
        setError('Artigo não encontrado ou ocorreu um erro ao carregar os dados.');
      }
    } catch (err: any) {
      console.error('Erro ao buscar artigo:', err);
      setArticle(null);
      setError('Não foi possível carregar o artigo. Por favor, tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar se o artigo está nos favoritos do usuário
  const checkIfFavorite = async () => {
    if (!isAuthenticated || !article) return;

    try {
      // Verificar se o artigo está nos favoritos
      const favorites = await articlesService.getMyFavorites();
      const isFav = favorites.some(fav => fav.id === article.id);
      setIsFavorite(isFav);
    } catch (err) {
      console.error('Erro ao verificar favoritos:', err);
    }
  };

  // Alternar favorito
  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !article) {
      showNotification('info', 'Você precisa estar logado para favoritar artigos.');
      return;
    }

    try {
      setIsTogglingFavorite(true);
      const result = await articlesService.toggleFavorite(article.id, params.slug);
      setIsFavorite(result.is_favorite);

      showNotification(
        'success',
        result.is_favorite
          ? 'Artigo adicionado aos favoritos!'
          : 'Artigo removido dos favoritos!'
      );
    } catch (err: any) {
      console.error('Erro ao alternar favorito:', err);
      showNotification('error', 'Não foi possível alterar o status de favorito.');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // Compartilhar artigo
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title || 'Artigo interessante',
          text: 'Confira este artigo interessante',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
      }
    } else {
      // Fallback para navegadores que não suportam a API Web Share
      navigator.clipboard.writeText(window.location.href);
      showNotification('success', 'Link copiado para a área de transferência!');
    }
  };

  useEffect(() => {
    fetchArticle();
  }, [params.slug]);

  useEffect(() => {
    if (article && isAuthenticated) {
      checkIfFavorite();
    }
  }, [article, isAuthenticated]);

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <motion.div
          className="h-16 w-16 relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full border-t-4 border-indigo-500 border-opacity-50"></div>
          <div className="absolute inset-0 rounded-full border-l-4 border-indigo-600 border-opacity-75"></div>
          <div className="absolute inset-0 rounded-full border-b-4 border-indigo-700"></div>
        </motion.div>
        <motion.p
          className="mt-6 text-gray-500 dark:text-gray-400 text-lg font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Carregando artigo...
        </motion.p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-[1800px] mx-auto px-3 md:px-6 lg:px-8 py-8">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-5 rounded-lg shadow-sm">
          <p className="font-medium">{error}</p>
          <Link href="/artigos" className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a lista de artigos
          </Link>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="w-full max-w-[1800px] mx-auto px-3 md:px-6 lg:px-8 py-8">
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-5 rounded-lg shadow-sm">
          <p className="font-medium">Artigo não encontrado.</p>
          <Link href="/artigos" className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a lista de artigos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1800px] mx-auto px-3 md:px-6 lg:px-8 xl:px-10 py-8">
      {/* Metadados para SEO */}
      <ArticleMeta article={article} />

      {/* Breadcrumbs */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Breadcrumbs
          items={[
            { label: 'Artigos', href: '/artigos' },
            { label: article.title }
          ]}
          className="mb-4"
        />
      </motion.div>

      <motion.div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Link href="/artigos" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-all hover:translate-x-[-5px]">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para a lista de artigos
        </Link>

        {/* Botões de edição e exclusão para autor ou superusuário */}
        {isAuthenticated && user && (
          (user.is_superuser || (article.author_id && String(user.id) === String(article.author_id)))
        ) && (
          <div className="flex space-x-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href={`/artigos/${article.slug}/editar`}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Edit className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Editar</span>
                <span className="inline md:hidden">Edit</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <DeleteArticleButton
                slug={article.slug}
                buttonText={window.innerWidth < 768 ? "Del" : "Excluir"}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              />
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Imagem de capa do artigo (simulada ou real) */}
      <motion.div
        className="cover-image-container mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <img
          src={article.cover_image || article.image || `https://source.unsplash.com/random/1200x600?sig=${article.id}&${article.title}`}
          alt={article.title}
          className="cover-image w-full h-auto object-cover max-h-[400px] md:max-h-[500px]"
        />
        <div className="cover-image-overlay">
          <motion.h1
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {article.title}
          </motion.h1>

          <motion.div
            className="flex flex-wrap items-center text-gray-200 gap-3 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
              <span>{formatDate(article.created_at)}</span>
            </div>

            {article.author && (
              <div className="flex items-center">
                <span className="mx-1">•</span>
                <User className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">Por {article.author.first_name} {article.author.last_name}</span>
              </div>
            )}

            {article.category && (
              <div className="flex items-center">
                <span className="mx-1">•</span>
                <Tag className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="text-indigo-300 truncate">{article.category.name}</span>
              </div>
            )}

            <div className="flex items-center">
              <span className="mx-1">•</span>
              <Eye className="w-4 h-4 mr-1 flex-shrink-0" />
              <span>{viewCount} visualizações</span>
            </div>

            <div className="flex items-center">
              <span className="mx-1">•</span>
              <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
              <span>{article.read_time || '5'} min de leitura</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.article
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 lg:p-8 article-enter"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        {/* Barra de ações */}
        <div className="action-buttons mb-8">
          <motion.button
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
            className={`action-button favorite-button ${isFavorite ? 'active' : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isFavorite ? (
              <BookmarkCheck className="w-5 h-5" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
            <span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span>
          </motion.button>

          <motion.button
            onClick={handleShare}
            className="action-button share-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="w-5 h-5" />
            <span>Compartilhar</span>
          </motion.button>
        </div>

        <div
          className="article-content prose prose-indigo dark:prose-invert max-w-none prose-img:rounded-lg prose-img:mx-auto prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </motion.article>

      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
      >
        <UnifiedCommentList
          contentType={ContentType.ARTICLE}
          contentId={article.slug}
          title="Comentários do Artigo"
        />
      </motion.div>
    </div>
  );
}
