'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getUserRating, getRatingSummary, rateItem, RatingSummary } from '../../services/api/ratings.service';

interface StarRatingProps {
  contentType: string;
  objectId: number;
  showSummary?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onChange?: (value: number) => void;
}

export default function StarRating({
  contentType,
  objectId,
  showSummary = false,
  size = 'md',
  className = '',
  onChange
}: StarRatingProps) {
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [summary, setSummary] = useState<RatingSummary>({
    average: 0,
    count: 0,
    distribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Tamanhos do ícone baseados no prop size
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Tamanhos do texto baseados no prop size
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Buscar avaliação do usuário e resumo
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        // Buscar resumo de avaliações
        const summaryData = await getRatingSummary(contentType, objectId);
        setSummary(summaryData);

        // Buscar avaliação do usuário se estiver autenticado
        if (isAuthenticated) {
          const userRatingData = await getUserRating(contentType, objectId);
          if (userRatingData) {
            setUserRating(userRatingData.value);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar avaliações:', error);
      }
    };

    fetchRatings();
  }, [contentType, objectId, isAuthenticated]);

  // Avaliar item
  const handleRate = async (value: number) => {
    if (!isAuthenticated) {
      showNotification('error', 'Você precisa estar autenticado para avaliar');
      return;
    }
    
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Se o usuário clicou na mesma estrela que já estava selecionada, remover a avaliação
      if (value === userRating) {
        value = 0;
      }
      
      if (value > 0) {
        await rateItem(contentType, objectId, value);
        showNotification('success', 'Avaliação registrada com sucesso');
      } else {
        // Implementar lógica para remover avaliação se necessário
        showNotification('success', 'Avaliação removida');
      }
      
      setUserRating(value);
      
      // Atualizar o resumo de avaliações
      const summaryData = await getRatingSummary(contentType, objectId);
      setSummary(summaryData);
      
      // Chamar o callback se fornecido
      if (onChange) {
        onChange(value);
      }
    } catch (error) {
      console.error('Erro ao avaliar:', error);
      showNotification('error', 'Não foi possível registrar sua avaliação');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar estrelas
  const renderStars = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => {
        const starValue = index + 1;
        const isFilled = hoverRating ? hoverRating >= starValue : userRating >= starValue;
        
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleRate(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={!isAuthenticated || isLoading}
            className={`focus:outline-none transition-colors ${!isAuthenticated ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
            title={`${starValue} ${starValue === 1 ? 'estrela' : 'estrelas'}`}
          >
            <Star
              className={`${iconSizes[size]} ${
                isFilled
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              } transition-colors`}
            />
          </button>
        );
      });
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-1">
        {renderStars()}
        
        {showSummary && summary.count > 0 && (
          <span className={`ml-2 text-gray-600 dark:text-gray-400 ${textSizes[size]}`}>
            ({summary.average.toFixed(1)}/5 • {summary.count} {summary.count === 1 ? 'avaliação' : 'avaliações'})
          </span>
        )}
      </div>
      
      {showSummary && summary.count > 0 && (
        <div className="mt-2 space-y-1">
          {Object.entries(summary.distribution)
            .sort((a, b) => Number(b[0]) - Number(a[0]))
            .map(([stars, count]) => {
              const percentage = summary.count > 0 ? (count / summary.count) * 100 : 0;
              
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className={`w-8 text-gray-600 dark:text-gray-400 ${textSizes[size]}`}>
                    {stars} ★
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className={`w-12 text-right text-gray-600 dark:text-gray-400 ${textSizes[size]}`}>
                    {count}
                  </span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
