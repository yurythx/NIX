'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import * as articlesService from '../../../../services/api/articles.service';
import { Article } from '../../../../types/article.types';
import ArticleForm from '../../components/ArticleForm';
import Header from '../../components/Header';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PermissionGuard from '../../../../components/auth/PermissionGuard';
import AccessDenied from '../../../../components/auth/AccessDenied';
import { useNotification } from '../../../../contexts/NotificationContext';

interface EditarArtigoPageProps {
  params: {
    slug: string;
  };
}

export default function EditarArtigoPage({ params }: EditarArtigoPageProps) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoadingArticle(true);
        const data = await articlesService.getArticleBySlug(params.slug);

        if (!data) {
          setError('Artigo não encontrado.');
          showNotification('error', 'Artigo não encontrado.');
          return;
        }

        setArticle(data);
      } catch (err: any) {
        console.error('Erro ao buscar artigo:', err);
        const errorMessage = 'Não foi possível carregar o artigo. Por favor, tente novamente mais tarde.';
        setError(errorMessage);
        showNotification('error', errorMessage);
      } finally {
        setIsLoadingArticle(false);
      }
    };

    fetchArticle();
  }, [params.slug, showNotification]);

  if (isLoadingArticle) {
    return (
      <>
        <Header />
        <div className="container-fluid w-full max-w-[1800px] mx-auto px-3 md:px-6 lg:px-8 xl:px-10 py-8">
          <div className="flex flex-col justify-center items-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">Carregando artigo...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container-fluid w-full max-w-[1800px] mx-auto px-3 md:px-6 lg:px-8 xl:px-10 py-8">
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-5 rounded-lg shadow-sm">
              <p className="font-medium">{error}</p>
              <Link href={`/artigos/${params.slug}`} className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para o artigo
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!article) {
    return (
      <>
        <Header />
        <div className="container-fluid w-full max-w-[1800px] mx-auto px-3 md:px-6 lg:px-8 xl:px-10 py-8">
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-5 rounded-lg shadow-sm">
              <p className="font-medium">Artigo não encontrado.</p>
              <Link href="/artigos" className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para a lista de artigos
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container-fluid w-full max-w-[1800px] mx-auto px-3 md:px-6 lg:px-8 xl:px-10 py-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <Link href={`/artigos/${params.slug}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o artigo
            </Link>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Editar Artigo</h1>

          <PermissionGuard
            requiredPermission="author"
            resourceOwnerId={article.author_id}
            fallback={
              <AccessDenied
                message="Você não tem permissão para editar este artigo."
                backUrl={`/artigos/${params.slug}`}
                backLabel="Voltar para o artigo"
              />
            }
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 lg:p-8">
              <ArticleForm
                article={article}
                onSuccess={() => {
                  showNotification('success', 'Artigo atualizado com sucesso!');
                  router.push(`/artigos/${article.slug}`);
                }}
              />
            </div>
          </PermissionGuard>
        </div>
      </div>
    </>
  );
}
