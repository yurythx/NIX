'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Github, Twitter, Linkedin, Heart } from 'lucide-react';

const AnimatedFooter = () => {
  return (
    <footer className="bg-gray-800 text-white shadow-lg border-t border-gray-700">
      <motion.div
        className="w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >

      {/* Conteúdo do footer */}
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div>
            <h3 className="text-sm font-bold">Projeto Prometheus</h3>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 justify-center">
            <Link href="/artigos" className="text-gray-300 hover:text-white transition-colors text-xs">
              Artigos
            </Link>
            <Link href="/mangas" className="text-gray-300 hover:text-white transition-colors text-xs">
              Mangás
            </Link>
            <Link href="/sobre" className="text-gray-300 hover:text-white transition-colors text-xs">
              Sobre
            </Link>
            <Link href="/contato" className="text-gray-300 hover:text-white transition-colors text-xs">
              Contato
            </Link>
          </div>

          <div className="flex space-x-3">
            <Link href="#" className="text-gray-400 hover:text-white transition-colors">
              <Github size={14} />
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white transition-colors">
              <Twitter size={14} />
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white transition-colors">
              <Linkedin size={14} />
            </Link>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-gray-700 text-center">
          <p className="text-gray-400 flex items-center justify-center text-xs">
            Feito com <Heart size={10} className="mx-1 text-red-500" /> por Projeto Prometheus © {new Date().getFullYear()}
          </p>
        </div>
      </div>
      </motion.div>
    </footer>
  );
};

export default AnimatedFooter;
