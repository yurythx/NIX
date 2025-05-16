'use client';

import { ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';

interface AccessDeniedProps {
  message?: string;
  backUrl?: string;
  backLabel?: string;
  loginUrl?: string;
}

export default function AccessDenied({
  message = 'Você não tem permissão para acessar esta página.',
  backUrl = '/',
  backLabel = 'Voltar para a página inicial',
  loginUrl
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
            <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Acesso Negado
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>
        
        <div className="flex flex-col space-y-3">
          <Link
            href={backUrl}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backLabel}
          </Link>
          
          {loginUrl && (
            <Link
              href={loginUrl}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Fazer login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
