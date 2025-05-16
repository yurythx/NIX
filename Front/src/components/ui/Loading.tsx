'use client';

import React from 'react';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'indigo' | 'purple' | 'red' | 'green' | 'yellow';
  fullscreen?: boolean;
  className?: string;
  hideText?: boolean;
}

export default function Loading({
  text = 'Carregando...',
  size = 'md',
  color = 'indigo',
  fullscreen = false,
  className = '',
  hideText = false,
}: LoadingProps) {
  // Mapear tamanhos para classes CSS
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  // Mapear cores para classes CSS
  const colorClasses = {
    blue: 'text-blue-500',
    indigo: 'text-indigo-500',
    purple: 'text-purple-500',
    red: 'text-red-500',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
  };

  // Definir classes para o container
  const containerClasses = `
    flex flex-col items-center justify-center
    ${fullscreen ? 'fixed inset-0 bg-white/80 dark:bg-gray-900/80 z-50' : ''}
    ${className}
  `;

  return (
    <div className={containerClasses.trim()} data-testid="loading-container">
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        data-testid="loading-spinner"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      
      {!hideText && (
        <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          {text}
        </p>
      )}
    </div>
  );
}
