'use client';

import { useRouter } from 'next/navigation';
import ArticleForm from '../components/ArticleForm';
import PermissionGuard from '../../../components/auth/PermissionGuard';
import AccessDenied from '../../../components/auth/AccessDenied';
import { useNotification } from '../../../contexts/NotificationContext';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NovoArtigoPage() {
  const router = useRouter();
  const { showNotification } = useNotification();

  return (
    <>
      <div className="container-fluid w-full max-w-[2000px] mx-auto px-3 md:px-6 lg:px-8 xl:px-10 py-4">
        <div className="w-full mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center">
              <Link href="/artigos" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para a lista de artigos
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Novo Artigo</h1>
            </div>
          </div>

          <PermissionGuard
            requiredPermission="authenticated"
            redirectTo="/login?redirect=/artigos/novo"
            fallback={
              <AccessDenied
                message="Você precisa estar logado para criar um artigo."
                backUrl="/artigos"
                backLabel="Voltar para a lista de artigos"
                loginUrl="/login?redirect=/artigos/novo"
              />
            }
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
              <ArticleForm
                onSuccess={() => {
                  showNotification('success', 'Artigo criado com sucesso!');
                  router.push('/artigos');
                }}
              />
            </div>
          </PermissionGuard>
        </div>
      </div>
    </>
  );
}
