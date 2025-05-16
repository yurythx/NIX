'use client';

import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 rounded-lg overflow-hidden">
      <div className="absolute inset-0 bg-pattern opacity-10"></div>
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center md:text-left md:flex md:items-center md:justify-between">
          <div className="md:max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Descubra Artigos Incríveis
            </h1>
            <p className="text-lg md:text-xl text-indigo-100 mb-6">
              Explore nossos artigos sobre tecnologia, mangás, cultura e muito mais. Conteúdo exclusivo e atualizado regularmente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/artigos/tecnologia" className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                <FileText className="w-5 h-5" />
                Artigos de Tecnologia
              </Link>
              <Link href="/artigos/manga" className="bg-indigo-700 text-white hover:bg-indigo-800 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                <FileText className="w-5 h-5" />
                Artigos sobre Mangás
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-64 h-64 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <FileText className="w-24 h-24 text-white/80" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
