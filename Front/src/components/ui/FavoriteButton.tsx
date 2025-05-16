'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { isFavorite, toggleFavorite } from '../../services/api/favorites.service';

interface FavoriteButtonProps {
  contentType: string;
  objectId: number;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function FavoriteButton({
  contentType,
  objectId,
  className = '',
  showText = false,
  size = 'md'
}: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const [isFav, setIsFav] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Tamanhos do ícone baseados no prop size
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Tamanhos do botão baseados no prop size
  const buttonSizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  // Verificar se o item é favorito
  useEffect(() => {
    const checkFavorite = async () => {
      if (!isAuthenticated) return;
      
      try {
        const result = await isFavorite(contentType, objectId);
        setIsFav(result);
      } catch (error) {
        console.error('Erro ao verificar favorito:', error);
      }
    };

    checkFavorite();
  }, [contentType, objectId, isAuthenticated]);

  // Alternar favorito
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      showNotification('error', 'Você precisa estar autenticado para favoritar');
      return;
    }
    
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const result = await toggleFavorite(contentType, objectId);
      setIsFav(result);
      
      showNotification(
        'success',
        result ? 'Adicionado aos favoritos' : 'Removido dos favoritos'
      );
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      showNotification('error', 'Não foi possível alternar o favorito');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={!isAuthenticated || isLoading}
      className={`${buttonSizes[size]} rounded-full flex items-center gap-1 transition-colors ${
        isFav
          ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
      } ${className} ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Heart
        className={`${iconSizes[size]} ${isFav ? 'fill-red-600 dark:fill-red-400' : ''} ${
          isLoading ? 'animate-pulse' : ''
        }`}
      />
      {showText && (
        <span className={`text-sm ${isFav ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
          {isFav ? 'Favoritado' : 'Favoritar'}
        </span>
      )}
    </button>
  );
}
