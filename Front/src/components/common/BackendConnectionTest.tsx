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
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Status da Conexão com o Backend</h2>
      
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Testando conexão...</span>
        </div>
      )}
      
      {!loading && isAvailable === true && (
        <div className="mb-4">
          <div className="flex items-center text-green-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Backend conectado com sucesso!</span>
          </div>
          
          {testResponse && (
            <div className="bg-gray-50 p-3 rounded-md mt-2">
              <p><strong>Status:</strong> {testResponse.status}</p>
              <p><strong>Mensagem:</strong> {testResponse.message}</p>
              <p><strong>Timestamp:</strong> {new Date(testResponse.timestamp).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}
      
      {!loading && isAvailable === false && (
        <div className="mb-4">
          <div className="flex items-center text-red-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="font-medium">Não foi possível conectar ao backend</span>
          </div>
          
          {error && (
            <div className="bg-red-50 p-3 rounded-md mt-2 text-red-800">
              <p><strong>Erro:</strong> {error}</p>
            </div>
          )}
          
          <p className="mt-2 text-gray-600">
            Verifique se o servidor backend está rodando em {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
          </p>
        </div>
      )}
      
      <div className="mt-4">
        <button
          onClick={handleRetry}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? 'Testando...' : 'Testar Novamente'}
        </button>
      </div>
    </div>
  );
}
