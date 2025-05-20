'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, BookOpen, Sparkles, Gift, ArrowRight, Moon, Stars, Sunrise, Lightbulb } from 'lucide-react';
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
          NIX
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Da escuridão para a luz: iluminando mentes através do conhecimento
        </p>
      </motion.div>

      {/* Seção Sobre o NIX - A Deusa da Noite */}
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
                <Moon className="mr-3 text-indigo-500" size={28} />
                Nix: A Deusa da Noite
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Na mitologia grega, Nix é a deusa primordial da Noite, nascida do Caos. Figura poderosa e misteriosa, era temida até mesmo por Zeus, o rei dos deuses. Nix representa o ciclo natural entre luz e escuridão, conhecimento e mistério.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Assim como Nix traz a noite que permite o descanso e a reflexão, nossa plataforma oferece um espaço para absorver conhecimento, refletir sobre ideias e despertar para novos entendimentos.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Da escuridão da ignorância para a luz do conhecimento — este é o ciclo que nossa plataforma NIX busca perpetuar, inspirada pela deusa que governa o ritmo entre o dia e a noite.
              </p>
            </div>
            <div className="md:w-1/2 bg-gradient-to-br from-indigo-800 to-purple-900 flex items-center justify-center p-8">
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative">
                  <Stars className="w-64 h-64 text-white/20 absolute" />
                  <Moon className="w-32 h-32 text-white relative z-10" />
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-indigo-500/30 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Seção Sobre a Plataforma NIX */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="mb-16"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="md:flex flex-row-reverse">
            <div className="md:w-1/2 p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <Lightbulb className="mr-3 text-yellow-500" size={28} />
                Nossa Plataforma
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                NIX é uma plataforma moderna de gerenciamento de conteúdo digital, projetada para facilitar o acesso e compartilhamento de conhecimento em diversos formatos.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Nossa plataforma integra artigos, livros e mangás em um único ambiente, permitindo que usuários explorem conteúdo diversificado de forma intuitiva e personalizada.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Desenvolvido com tecnologias modernas, o NIX oferece uma experiência fluida e responsiva, adaptando-se a diferentes dispositivos e necessidades dos usuários.
              </p>
            </div>
            <div className="md:w-1/2 bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center p-8">
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

      {/* Nossos Valores - Inspirados por Nix */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="mb-16"
      >
        <h2 className="text-3xl font-bold mb-8 text-center">Nossos Valores</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Stars className="text-purple-600 dark:text-purple-300" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Do Mistério ao Conhecimento</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Assim como Nix governa o reino da noite onde os mistérios residem, buscamos transformar o desconhecido em conhecimento acessível, iluminando mentes através de conteúdo de qualidade.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="bg-indigo-100 dark:bg-indigo-900 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Sunrise className="text-indigo-600 dark:text-indigo-300" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Ciclos de Aprendizado</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Nix representa o ciclo eterno entre dia e noite. Nossa plataforma promove ciclos contínuos de aprendizado, onde cada novo conhecimento leva a novas descobertas e perspectivas.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Moon className="text-blue-600 dark:text-blue-300" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Poder Transformador</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Nix era temida até por Zeus pelo seu poder primordial. Acreditamos no poder transformador do conhecimento, capaz de mudar vidas e sociedades quando compartilhado livremente.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Nossa Missão */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.7 }}
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
              Buscamos tornar o conhecimento acessível a todos, através de artigos, livros, mangás e recursos educacionais em um único ambiente.
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
        <div className="bg-gradient-to-r from-indigo-800 to-purple-900 rounded-xl p-8 md:p-12 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <Stars className="w-full h-full text-white" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Da escuridão para a luz
            </h2>
            <p className="text-purple-100 mb-8 max-w-2xl mx-auto">
              Assim como Nix traz a noite que eventualmente cede lugar ao dia, junte-se a nós para transformar a escuridão da ignorância na luz do conhecimento compartilhado.
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center px-6 py-3 bg-white text-purple-800 font-medium rounded-lg shadow-md hover:bg-purple-50 transition-colors"
            >
              Comece sua jornada <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SobrePage;
