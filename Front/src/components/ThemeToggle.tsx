'use client';

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FiSun, FiMoon, FiBook, FiMonitor } from 'react-icons/fi';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme, useSystemTheme } = useTheme();

  // Função para obter o ícone do tema atual
  const getThemeIcon = () => {
    if (useSystemTheme) {
      return <FiMonitor className="w-5 h-5" />;
    }
    
    switch (theme) {
      case 'light':
        return <FiSun className="w-5 h-5" />;
      case 'dark':
        return <FiMoon className="w-5 h-5" />;
      case 'sepia':
        return <FiBook className="w-5 h-5" />;
      default:
        return <FiMoon className="w-5 h-5" />;
    }
  };

  // Função para obter o título do botão
  const getThemeTitle = () => {
    if (useSystemTheme) {
      return 'Tema do sistema';
    }
    
    switch (theme) {
      case 'light':
        return 'Modo claro';
      case 'dark':
        return 'Modo escuro';
      case 'sepia':
        return 'Modo sépia';
      default:
        return 'Alternar tema';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
      aria-label="Alternar tema"
      title={getThemeTitle()}
    >
      {getThemeIcon()}
    </button>
  );
};

export default ThemeToggle;
