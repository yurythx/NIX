'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, BookOpen, Sparkles, Gift, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const SobrePage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Cabeçalho */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
          Projeto Prometheus
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Inspirado no titã que trouxe o fogo do conhecimento para a humanidade
        </p>
      </motion.div>

      {/* Seção do Mito */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="mb-16"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2 p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <Flame className="mr-3 text-orange-500" size={28} />
                O Mito de Prometeu
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Na mitologia grega, Prometeu foi um titã que desafiou os deuses ao roubar o fogo do Olimpo e entregá-lo aos humanos. Este ato simboliza a transmissão do conhecimento e da tecnologia para a humanidade.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Zeus, enfurecido com esta transgressão, puniu Prometeu acorrentando-o a uma rocha onde uma águia devorava seu fígado todos os dias, que se regenerava durante a noite, perpetuando seu sofrimento.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Apesar da punição severa, Prometeu é lembrado como um benfeitor da humanidade, um símbolo da busca pelo conhecimento e da resistência contra a tirania.
              </p>
            </div>
            <div className="md:w-1/2 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center p-8">
              <div className="w-full h-full flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-48 h-48 text-white">
                  <path fill="currentColor" d="M100,20 C120,20 140,30 150,50 C160,70 160,90 150,110 C140,130 120,140 100,140 C80,140 60,130 50,110 C40,90 40,70 50,50 C60,30 80,20 100,20 Z" />
                  <path fill="currentColor" d="M100,40 L100,120 M80,60 L120,60 M80,80 L120,80 M80,100 L120,100" stroke="white" strokeWidth="2" />
                  <path fill="none" stroke="white" strokeWidth="2" d="M70,30 C80,25 90,20 100,20 C110,20 120,25 130,30" />
                  <path fill="none" stroke="white" strokeWidth="2" d="M100,140 L100,180 M90,160 L110,160 M90,180 L110,180" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Nossa Missão */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="mb-16"
      >
        <h2 className="text-3xl font-bold mb-8 text-center">Nossa Missão</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="text-purple-600 dark:text-purple-300" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Compartilhar Conhecimento</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Assim como Prometeu trouxe o fogo, buscamos trazer conhecimento acessível a todos, através de artigos, tutoriais e recursos educacionais.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="bg-indigo-100 dark:bg-indigo-900 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="text-indigo-600 dark:text-indigo-300" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Inspirar Criatividade</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Incentivamos a exploração de novas ideias e a expressão criativa através de nossa plataforma de conteúdo diversificado.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Gift className="text-blue-600 dark:text-blue-300" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Construir Comunidade</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Criamos um espaço onde pessoas podem se conectar, compartilhar experiências e crescer juntas através do conhecimento compartilhado.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-center"
      >
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 md:p-12 shadow-lg">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Junte-se à nossa jornada
          </h2>
          <p className="text-purple-100 mb-8 max-w-2xl mx-auto">
            Explore nosso conteúdo, participe da comunidade e ajude-nos a espalhar o conhecimento, assim como Prometeu fez com o fogo sagrado.
          </p>
          <Link
            href="/registro"
            className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-medium rounded-lg shadow-md hover:bg-purple-50 transition-colors"
          >
            Comece agora <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SobrePage;
