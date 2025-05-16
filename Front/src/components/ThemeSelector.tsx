'use client';

import React from 'react';
import { useTheme, themeColors, Theme, ThemeColor } from '../contexts/ThemeContext';
import { FiSun, FiMoon, FiBook, FiMonitor, FiCheck, FiLoader } from 'react-icons/fi';

interface ThemeSelectorProps {
  className?: string;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ className = '' }) => {
  const { 
    theme, 
    themeColor, 
    setTheme, 
    setThemeColor, 
    toggleTheme,
    useSystemTheme,
    setUseSystemTheme,
    isSaving
  } = useTheme();

  // Função para obter o ícone do tema atual
  const getThemeIcon = () => {
    if (useSystemTheme) return <FiMonitor className="w-5 h-5" />;
    
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

  // Função para obter o nome do tema atual
  const getThemeName = () => {
    if (useSystemTheme) return 'Sistema';
    
    switch (theme) {
      case 'light':
        return 'Claro';
      case 'dark':
        return 'Escuro';
      case 'sepia':
        return 'Sépia';
      default:
        return 'Escuro';
    }
  };

  // Função para obter a cor do tema atual
  const getThemeColorName = () => {
    switch (themeColor) {
      case 'blue':
        return 'Azul';
      case 'purple':
        return 'Roxo';
      case 'green':
        return 'Verde';
      case 'red':
        return 'Vermelho';
      case 'orange':
        return 'Laranja';
      default:
        return 'Azul';
    }
  };

  return (
    <div className={`theme-selector ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Modo de Exibição</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            onClick={() => setUseSystemTheme(true)}
            className={`flex items-center justify-center p-3 rounded-lg ${
              useSystemTheme
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex flex-col items-center">
              <FiMonitor className="w-6 h-6 mb-1" />
              <span className="text-sm">Sistema</span>
              {useSystemTheme && <FiCheck className="w-4 h-4 mt-1" />}
            </div>
          </button>
          
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center p-3 rounded-lg ${
              theme === 'light' && !useSystemTheme
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex flex-col items-center">
              <FiSun className="w-6 h-6 mb-1" />
              <span className="text-sm">Claro</span>
              {theme === 'light' && !useSystemTheme && <FiCheck className="w-4 h-4 mt-1" />}
            </div>
          </button>
          
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center p-3 rounded-lg ${
              theme === 'dark' && !useSystemTheme
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex flex-col items-center">
              <FiMoon className="w-6 h-6 mb-1" />
              <span className="text-sm">Escuro</span>
              {theme === 'dark' && !useSystemTheme && <FiCheck className="w-4 h-4 mt-1" />}
            </div>
          </button>
          
          <button
            onClick={() => setTheme('sepia')}
            className={`flex items-center justify-center p-3 rounded-lg ${
              theme === 'sepia' && !useSystemTheme
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex flex-col items-center">
              <FiBook className="w-6 h-6 mb-1" />
              <span className="text-sm">Sépia</span>
              {theme === 'sepia' && !useSystemTheme && <FiCheck className="w-4 h-4 mt-1" />}
            </div>
          </button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">Cor do Tema</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(themeColors).map(([color, values]) => (
            <button
              key={color}
              onClick={() => setThemeColor(color as ThemeColor)}
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                themeColor === color ? 'border-gray-900 dark:border-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: values.primary }}
              aria-label={`Tema ${color}`}
            >
              {themeColor === color && <FiCheck className="w-4 h-4 text-white" />}
            </button>
          ))}
        </div>
      </div>
      
      {isSaving && (
        <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <FiLoader className="w-4 h-4 mr-2 animate-spin" />
          Salvando preferências...
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
