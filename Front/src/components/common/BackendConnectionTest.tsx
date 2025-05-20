'use client';

import { useEffect, useState } from 'react';
import { isBackendAvailable, testBackendConnection, TestResponse } from '@/services/api/test.service';

/**
 * Componente para testar a conexão com o backend
 */
export default function BackendConnectionTest() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [testResponse, setTestResponse] = useState<TestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        setLoading(true);
        const available = await isBackendAvailable();
        setIsAvailable(available);

        if (available) {
          const response = await testBackendConnection();
          setTestResponse(response);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao testar conexão com o backend');
      } finally {
        setLoading(false);
      }
    };

    checkBackendConnection();
  }, []);

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    setIsAvailable(null);
    setTestResponse(null);

    try {
      const available = await isBackendAvailable();
      setIsAvailable(available);

      if (available) {
        const response = await testBackendConnection();
        setTestResponse(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao testar conexão com o backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-sm">
      {loading && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-500 dark:text-gray-400">Verificando sistema...</span>
        </div>
      )}

      {!loading && isAvailable === true && (
        <div className="flex items-center text-green-600 dark:text-green-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Sistema operacional</span>
        </div>
      )}

      {!loading && isAvailable === false && (
        <div className="flex items-center text-amber-600 dark:text-amber-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Modo offline - algumas funcionalidades podem estar limitadas</span>
        </div>
      )}
    </div>
  );
}
