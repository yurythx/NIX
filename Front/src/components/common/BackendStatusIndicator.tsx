'use client';

import { useEffect, useState, useCallback } from 'react';
import { isBackendAvailable } from '@/services/api/test.service';
import { motion } from 'framer-motion';

/**
 * Componente que mostra um indicador de status da conexão com o backend
 * Exibe um círculo verde quando o backend está online e vermelho quando está offline
 */
export default function BackendStatusIndicator() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checkingNow, setCheckingNow] = useState<boolean>(false);
  const [showPulse, setShowPulse] = useState<boolean>(false);

  // Intervalo de verificação em milissegundos (15 segundos)
  const checkInterval = 15000;

  // Função para verificar a conexão com o backend
  const checkBackendConnection = useCallback(async () => {
    try {
      setCheckingNow(true);
      const available = await isBackendAvailable();
      setIsAvailable(available);
      setLastChecked(new Date());

      // Mostrar efeito de pulso quando o status muda
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 1000);
    } catch (err) {
      console.error('Erro ao verificar conexão com o backend:', err);
      setIsAvailable(false);
      setLastChecked(new Date());
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 1000);
    } finally {
      setLoading(false);
      setCheckingNow(false);
    }
  }, []);

  // Verificar manualmente a conexão
  const handleManualCheck = () => {
    checkBackendConnection();
  };

  useEffect(() => {
    // Verificar a conexão quando o componente é montado
    checkBackendConnection();

    // Verificar a conexão periodicamente
    const interval = setInterval(checkBackendConnection, checkInterval);

    // Limpar o intervalo quando o componente é desmontado
    return () => clearInterval(interval);
  }, [checkBackendConnection]);

  // Formatar o tempo desde a última verificação
  const getLastCheckedText = () => {
    if (!lastChecked) return 'Nunca verificado';

    const now = new Date();
    const diffMs = now.getTime() - lastChecked.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return `Verificado há ${diffSec} segundos`;
    const diffMin = Math.floor(diffSec / 60);
    return `Verificado há ${diffMin} minutos`;
  };

  return (
    <div className="relative flex items-center justify-center group">
      {loading ? (
        <motion.div
          className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      ) : (
        <motion.div
          className={`w-3 h-3 rounded-full ${
            isAvailable
              ? 'bg-green-500 dark:bg-green-400'
              : 'bg-red-500 dark:bg-red-400'
          } ${checkingNow ? 'opacity-70' : ''} ${showPulse ? 'animate-ping' : ''}`}
          initial={{ scale: 0.8 }}
          animate={{
            scale: checkingNow ? [0.8, 1, 0.8] : 1,
            transition: {
              duration: checkingNow ? 1 : 0.3,
              repeat: checkingNow ? Infinity : 0
            }
          }}
          onClick={handleManualCheck}
          title={`${isAvailable ? 'Sistema online' : 'Sistema offline'} - ${getLastCheckedText()}`}
          whileHover={{ scale: 1.2 }}
          style={{ cursor: 'pointer' }}
        />
      )}

      {/* Tooltip detalhado que aparece ao passar o mouse */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
        <div className="font-medium text-gray-900 dark:text-white mb-1">
          Status: {isAvailable ? 'Online' : 'Offline'}
        </div>
        <div className="text-gray-600 dark:text-gray-300 text-xs">
          {getLastCheckedText()}
        </div>
        {checkingNow && (
          <div className="text-blue-500 dark:text-blue-400 text-xs mt-1">
            Verificando agora...
          </div>
        )}
        <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
          Clique para verificar manualmente
        </div>
      </div>
    </div>
  );
}
