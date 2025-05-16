'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RegisterForm from '../../components/auth/RegisterForm';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, ChevronRight } from 'lucide-react';
import '../login/styles/LoginPage.css';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleRegisterSuccess = () => {
    router.push('/');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Lado esquerdo - Imagem e mensagem */}
      <motion.div
        className="login-hero md:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-8 md:p-12 flex flex-col justify-center relative overflow-hidden"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="login-hero-pattern absolute inset-0 opacity-10"></div>
        <div className="login-hero-glow absolute"></div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative z-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Junte-se ao Projeto Prometheus</h1>
          <p className="text-xl text-indigo-100 mb-8 max-w-md">
            Crie sua conta e comece a explorar conteúdo exclusivo sobre tecnologia, cultura e muito mais.
          </p>

          <div className="space-y-4">
            <div className="flex items-center text-white">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 mr-4">
                <ChevronRight className="w-6 h-6 text-white" />
              </div>
              <p className="text-lg">Crie e compartilhe conteúdo</p>
            </div>
            <div className="flex items-center text-white">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 mr-4">
                <ChevronRight className="w-6 h-6 text-white" />
              </div>
              <p className="text-lg">Personalize sua experiência</p>
            </div>
            <div className="flex items-center text-white">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 mr-4">
                <ChevronRight className="w-6 h-6 text-white" />
              </div>
              <p className="text-lg">Conecte-se com outros usuários</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="login-floating-shapes"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="login-shape shape-1"></div>
          <div className="login-shape shape-2"></div>
          <div className="login-shape shape-3"></div>
          <div className="login-shape shape-4"></div>
        </motion.div>
      </motion.div>

      {/* Lado direito - Formulário */}
      <motion.div
        className="md:w-1/2 bg-white dark:bg-gray-900 p-8 md:p-12 flex items-center justify-center"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="w-full max-w-md">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Criar uma nova conta
            </h2>

            <div className="mb-8">
              <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                Preencha os campos abaixo para se cadastrar
              </p>
              <div className="flex justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  Já tem uma conta? Faça login
                </Link>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
            >
              <RegisterForm onSuccess={handleRegisterSuccess} />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
