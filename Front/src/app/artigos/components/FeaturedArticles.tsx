'use client';

import { Clock, Tag } from 'lucide-react';
import Link from 'next/link';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  featured: boolean;
}

export default function FeaturedArticles() {
  // Dados simulados de artigos em destaque
  const featuredArticles: Article[] = [
    {
      id: 1,
      title: 'Como Criar um Blog com Next.js',
      excerpt: 'Um guia completo para criar um blog moderno usando Next.js, Tailwind CSS e TypeScript.',
      author: 'João Silva',
      date: '2023-08-15',
      readTime: '5 min',
      category: 'Tecnologia',
      tags: ['Next.js', 'React', 'Web Development'],
      featured: true
    },
    {
      id: 3,
      title: 'Tailwind CSS: Guia Definitivo',
      excerpt: 'Domine o Tailwind CSS e crie interfaces modernas com facilidade.',
      author: 'Pedro Oliveira',
      date: '2023-06-10',
      readTime: '6 min',
      category: 'Design',
      tags: ['CSS', 'Tailwind', 'UI/UX'],
      featured: true
    },
    {
      id: 4,
      title: 'Os Melhores Mangás de 2023',
      excerpt: 'Uma lista completa dos mangás mais populares e bem avaliados deste ano.',
      author: 'Ana Costa',
      date: '2023-09-05',
      readTime: '10 min',
      category: 'Mangá',
      tags: ['Mangá', 'Anime', 'Cultura Japonesa'],
      featured: true
    }
  ];

  // Formatar a data
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Artigos em Destaque</h2>
        <Link href="/artigos" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">
          Ver todos os artigos
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredArticles.map((article) => (
          <Link href={`/artigos/${article.id}`} key={article.id}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 mb-2">
                  <Tag className="w-4 h-4" />
                  <span>{article.category}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {article.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {article.excerpt}
                </p>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {article.author}
                </span>
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{article.readTime}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
