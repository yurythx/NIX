'use client';

import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Settings, Check, Monitor, Loader } from 'lucide-react';
import { useTheme, themeColors } from '../contexts/ThemeContext';

export default function ThemeSettings() {
  const {
    theme,
    themeColor,
    setThemeColor,
    setTheme,
    useSystemTheme,
    setUseSystemTheme,
    isSaving
  } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(themeColor);
  const [showFeedback, setShowFeedback] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Atualizar o estado local quando o themeColor mudar
  useEffect(() => {
    setSelectedColor(themeColor);
  }, [themeColor]);

  // Fechar o menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  // Função para aplicar a cor com feedback visual
  const applyThemeColor = (color: 'blue' | 'purple' | 'green' | 'red' | 'orange') => {
    // Verificar se a cor já está selecionada
    if (color === selectedColor) {
      // Mesmo se a cor já estiver selecionada, fechar o menu
      setIsOpen(false);
      return;
    }

    // Atualizar o estado local primeiro para feedback visual imediato
    setSelectedColor(color);

    // Aplicar a cor do tema com um pequeno atraso para permitir a animação
    setTimeout(() => {
      setThemeColor(color);
    }, 50);

    // Mostrar feedback visual
    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false);
    }, 1500);

    // Forçar uma atualização do DOM para aplicar as mudanças
    document.body.classList.add('theme-color-changing');
    setTimeout(() => {
      document.body.classList.remove('theme-color-changing');
    }, 300);

    // Fechar o menu após selecionar a cor
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  return (
    <div className="relative" ref={settingsRef}>
      <button
        onClick={toggleOpen}
        className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 shadow-lg transition-all hover:shadow-xl hover:scale-105 group"
        aria-label="Personalizar tema"
        title="Personalizar tema"
      >
        <Settings className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
      </button>

      {/* Feedback de tema aplicado */}
      {showFeedback && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out">
          <div className="flex items-center space-x-2">
            {isSaving ? (
              <Loader className="w-4 h-4 text-blue-400 animate-spin" />
            ) : (
              <Check className="w-4 h-4 text-green-400" />
            )}
            <span>
              {selectedColor !== themeColor
                ? `Cor do tema atualizada para ${selectedColor}`
                : useSystemTheme
                  ? 'Usando tema do sistema'
                  : theme === 'dark'
                    ? 'Tema escuro aplicado'
                    : theme === 'light'
                      ? 'Tema claro aplicado'
                      : 'Tema sépia aplicado'}
              {isSaving && ' (salvando...)'}
            </span>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg p-4 z-50 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-white">Personalização</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* Informação sobre o tema atual */}
            <div className="bg-gray-700/50 p-2 rounded-lg text-xs text-gray-300 flex items-start space-x-2">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              ) : theme === 'light' ? (
                <Sun className="w-4 h-4 mt-0.5 flex-shrink-0" />
              ) : (
                <Settings className="w-4 h-4 mt-0.5 flex-shrink-0" />
              )}
              <p>
                {theme === 'dark'
                  ? 'Modo escuro ativado para melhor experiência visual.'
                  : theme === 'light'
                    ? 'Modo claro ativado.'
                    : 'Modo sepia ativado para leitura confortável.'}
              </p>
            </div>

            {/* Seleção de tema */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Tema</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setUseSystemTheme(true);
                    setShowFeedback(true);
                    setTimeout(() => setShowFeedback(false), 1500);
                    setTimeout(() => setIsOpen(false), 300);
                  }}
                  className={`px-3 py-2 rounded-md flex items-center justify-center transition-all ${
                    useSystemTheme
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  <span className="text-xs">Sistema</span>
                  {useSystemTheme && <Check className="w-3 h-3 ml-1" />}
                </button>
                <button
                  onClick={() => {
                    setTheme('light');
                    setUseSystemTheme(false);
                    setShowFeedback(true);
                    setTimeout(() => setShowFeedback(false), 1500);
                    setTimeout(() => setIsOpen(false), 300);
                  }}
                  className={`px-3 py-2 rounded-md flex items-center justify-center transition-all ${
                    theme === 'light' && !useSystemTheme
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Sun className="w-4 h-4 mr-2" />
                  <span className="text-xs">Claro</span>
                  {theme === 'light' && !useSystemTheme && <Check className="w-3 h-3 ml-1" />}
                </button>
                <button
                  onClick={() => {
                    setTheme('dark');
                    setUseSystemTheme(false);
                    setShowFeedback(true);
                    setTimeout(() => setShowFeedback(false), 1500);
                    setTimeout(() => setIsOpen(false), 300);
                  }}
                  className={`px-3 py-2 rounded-md flex items-center justify-center transition-all ${
                    theme === 'dark' && !useSystemTheme
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Moon className="w-4 h-4 mr-2" />
                  <span className="text-xs">Escuro</span>
                  {theme === 'dark' && !useSystemTheme && <Check className="w-3 h-3 ml-1" />}
                </button>
                <button
                  onClick={() => {
                    setTheme('sepia');
                    setUseSystemTheme(false);
                    setShowFeedback(true);
                    setTimeout(() => setShowFeedback(false), 1500);
                    setTimeout(() => setIsOpen(false), 300);
                  }}
                  className={`px-3 py-2 rounded-md flex items-center justify-center transition-all ${
                    theme === 'sepia' && !useSystemTheme
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  <span className="text-xs">Sepia</span>
                  {theme === 'sepia' && !useSystemTheme && <Check className="w-3 h-3 ml-1" />}
                </button>
              </div>
            </div>

            {/* Seleção de cor */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Cor do Tema</h4>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(themeColors).map(([color, colorValues]) => (
                  <button
                    key={color}
                    onClick={() => applyThemeColor(color as 'blue' | 'purple' | 'green' | 'red' | 'orange')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${
                      selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-gray-800 scale-110' : 'hover:scale-105'
                    }`}
                    aria-label={`Tema ${color}`}
                    style={{
                      backgroundColor: colorValues.primary,
                      boxShadow: selectedColor === color ? `0 0 0 2px ${colorValues.primary}` : 'none'
                    }}
                  >
                    {selectedColor === color && <Check className="w-5 h-5 text-white" />}
                  </button>
                ))}
              </div>

              <div className="mt-3 text-xs text-gray-400 text-center">
                Clique em uma cor para aplicar ao tema
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
