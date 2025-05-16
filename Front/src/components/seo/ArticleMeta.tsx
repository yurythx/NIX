'use client';

import Head from 'next/head';
import { usePathname } from 'next/navigation';
import { Article } from '../../types/models';

interface ArticleMetaProps {
  article: Article;
  baseUrl?: string;
}

export default function ArticleMeta({ article, baseUrl = 'https://viixen.com' }: ArticleMetaProps) {
  const pathname = usePathname();
  const url = `${baseUrl}${pathname}`;
  
  // Extrair um resumo do conteúdo do artigo (primeiros 160 caracteres)
  const getDescription = (): string => {
    // Remover tags HTML
    const textContent = article.content.replace(/<[^>]*>/g, '');
    // Limitar a 160 caracteres
    return textContent.length > 160 
      ? textContent.substring(0, 157) + '...' 
      : textContent;
  };
  
  const description = getDescription();
  const title = `${article.title} | Viixen`;
  const imageUrl = article.cover_image || article.image || `${baseUrl}/images/default-article.jpg`;
  
  return (
    <Head>
      {/* Metadados básicos */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="article" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={imageUrl} />
      
      {/* Metadados adicionais para artigos */}
      {article.category && (
        <meta property="article:section" content={article.category.name} />
      )}
      <meta property="article:published_time" content={article.created_at} />
      {article.author && (
        <meta property="article:author" content={`${article.author.first_name} ${article.author.last_name}`} />
      )}
    </Head>
  );
}
