'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { usersService } from '../services/api';
import { getThemeSettings, saveThemeSettings } from '../services/api/settings.service';

// Definição dos tipos de tema
export type Theme = 'light' | 'dark' | 'sepia';
export type ThemeColor = 'blue' | 'purple' | 'green' | 'red' | 'orange';

// Definição das cores para cada tema
export const themeColors = {
  blue: {
    primary: '#4f46e5',
    hover: '#4338ca',
    rgb: '79, 70, 229',
  },
  purple: {
    primary: '#8b5cf6',
    hover: '#7c3aed',
    rgb: '139, 92, 246',
  },
  green: {
    primary: '#10b981',
    hover: '#059669',
    rgb: '16, 185, 129',
  },
  red: {
    primary: '#ef4444',
    hover: '#dc2626',
    rgb: '239, 68, 68',
  },
  orange: {
    primary: '#f97316',
    hover: '#ea580c',
    rgb: '249, 115, 22',
  },
};

interface ThemeContextType {
  theme: Theme;
  themeColor: ThemeColor;
  setTheme: (theme: Theme) => void;
  setThemeColor: (color: ThemeColor) => void;
  toggleTheme: () => void;
  useSystemTheme: boolean;
  setUseSystemTheme: (value: boolean) => void;
  isSaving: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [theme, setThemeState] = useState<Theme>('dark');
  const [themeColor, setThemeColorState] = useState<ThemeColor>('blue');
  const [useSystemTheme, setUseSystemThemeState] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Função para salvar as preferências de tema no backend
  const saveThemePreferences = async (newTheme: Theme, newColor: ThemeColor, useSystem: boolean) => {
    try {
      setIsSaving(true);

      // Usar o serviço de configurações para salvar as preferências
      await saveThemeSettings({
        theme: newTheme,
        theme_color: newColor,
        use_system_theme: useSystem
      });

    } catch (error) {
      console.error('Erro ao salvar preferências de tema:', error);
      // Em caso de erro, garantir que as preferências sejam salvas localmente
      localStorage.setItem('theme', newTheme);
      localStorage.setItem('themeColor', newColor);
      localStorage.setItem('useSystemTheme', useSystem.toString());
    } finally {
      setIsSaving(false);
    }
  };

  // Função para definir o tema com salvamento no backend
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    // Salvar no localStorage para persistência geral
    localStorage.setItem('theme', newTheme);

    // Se o usuário estiver autenticado, salvar também no sessionStorage
    if (isAuthenticated) {
      sessionStorage.setItem('theme', newTheme);
    }

    if (isInitialized) {
      saveThemePreferences(newTheme, themeColor, false);
      setUseSystemThemeState(false);
      localStorage.setItem('useSystemTheme', 'false');
      if (isAuthenticated) {
        sessionStorage.setItem('useSystemTheme', 'false');
      }
    }
  };

  // Função para definir a cor do tema com salvamento no backend
  const setThemeColor = (newColor: ThemeColor) => {
    setThemeColorState(newColor);

    // Salvar no localStorage para persistência geral
    localStorage.setItem('themeColor', newColor);

    // Se o usuário estiver autenticado, salvar também no sessionStorage
    if (isAuthenticated) {
      sessionStorage.setItem('themeColor', newColor);
    }

    if (isInitialized) {
      saveThemePreferences(theme, newColor, useSystemTheme);
    }
  };

  // Função para definir o uso do tema do sistema
  const setUseSystemTheme = (value: boolean) => {
    setUseSystemThemeState(value);

    // Salvar no localStorage para persistência geral
    localStorage.setItem('useSystemTheme', value.toString());

    // Se o usuário estiver autenticado, salvar também no sessionStorage
    if (isAuthenticated) {
      sessionStorage.setItem('useSystemTheme', value.toString());
    }

    if (value && typeof window !== 'undefined') {
      // Se ativar o tema do sistema, aplicar imediatamente
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme: Theme = prefersDark ? 'dark' : 'light';
      setThemeState(systemTheme);
    }

    if (isInitialized) {
      saveThemePreferences(theme, themeColor, value);
    }
  };

  // Inicializar tema do localStorage, sessionStorage, backend ou usar dark como padrão
  useEffect(() => {
    // Executar apenas no cliente para evitar erros de hidratação
    if (typeof window === 'undefined') return;

    // Verificar se há um tema salvo no sessionStorage (para usuários autenticados)
    let savedTheme = sessionStorage.getItem('theme') as Theme | null;
    let savedColor = sessionStorage.getItem('themeColor') as ThemeColor | null;
    let savedUseSystemTheme = sessionStorage.getItem('useSystemTheme');

    // Se não houver no sessionStorage, verificar no localStorage
    if (!savedTheme) {
      savedTheme = localStorage.getItem('theme') as Theme | null;
    }
    if (!savedColor) {
      savedColor = localStorage.getItem('themeColor') as ThemeColor | null;
    }
    if (!savedUseSystemTheme) {
      savedUseSystemTheme = localStorage.getItem('useSystemTheme');
    }

    // Verificar se deve usar o tema do sistema
    const shouldUseSystemTheme = savedUseSystemTheme === 'true';
    setUseSystemThemeState(shouldUseSystemTheme);

    // Se deve usar o tema do sistema
    if (shouldUseSystemTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(prefersDark ? 'dark' : 'light');
    }
    // Se houver um tema salvo, use-o
    else if (savedTheme) {
      setThemeState(savedTheme);
    }
    // Caso contrário, usar o tema escuro como padrão
    else {
      const defaultTheme = 'dark';
      localStorage.setItem('theme', defaultTheme);
      if (isAuthenticated) {
        sessionStorage.setItem('theme', defaultTheme);
      }
    }

    // Definir a cor do tema
    if (savedColor) {
      setThemeColorState(savedColor);
    }

    setIsInitialized(true);
  }, [isAuthenticated]);

  // Carregar preferências do usuário do backend quando ele fizer login
  useEffect(() => {
    // Não tentar carregar se não estiver inicializado
    if (!isInitialized) return;

    const loadUserPreferences = async () => {
      try {
        // Usar o serviço de configurações para carregar as preferências
        const themeSettings = getThemeSettings();

        // Atualizar tema apenas se o usuário não estiver usando o tema do sistema
        if (themeSettings.theme && !themeSettings.use_system_theme) {
          setThemeState(themeSettings.theme as Theme);
        }

        // Atualizar cor do tema
        if (themeSettings.theme_color) {
          setThemeColorState(themeSettings.theme_color as ThemeColor);
        }

        // Atualizar preferência de tema do sistema
        if (themeSettings.use_system_theme !== undefined) {
          setUseSystemThemeState(themeSettings.use_system_theme);

          // Se o usuário preferir o tema do sistema, aplicar imediatamente
          if (themeSettings.use_system_theme && typeof window !== 'undefined') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setThemeState(prefersDark ? 'dark' : 'light');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar preferências de tema:', error);

        // Em caso de erro, usar as preferências locais
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        const savedColor = localStorage.getItem('themeColor') as ThemeColor | null;
        const savedUseSystemTheme = localStorage.getItem('useSystemTheme');

        if (savedTheme) {
          setThemeState(savedTheme);
        }

        if (savedColor) {
          setThemeColorState(savedColor);
        }

        if (savedUseSystemTheme !== null) {
          const useSystem = savedUseSystemTheme === 'true';
          setUseSystemThemeState(useSystem);

          if (useSystem && typeof window !== 'undefined') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setThemeState(prefersDark ? 'dark' : 'light');
          }
        }
      }
    };

    loadUserPreferences();
  }, [isInitialized]);

  // Aplicar tema ao documento
  useEffect(() => {
    // Executar apenas no cliente para evitar erros de hidratação
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // Remover todas as classes de tema
    root.classList.remove('light', 'dark', 'sepia');

    // Adicionar a classe do tema atual
    root.classList.add(theme);

    // Salvar no localStorage
    localStorage.setItem('theme', theme);

    // Atualizar a meta tag theme-color para dispositivos móveis
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      if (theme === 'dark') {
        metaThemeColor.setAttribute('content', '#1f2937');
      } else if (theme === 'light') {
        metaThemeColor.setAttribute('content', '#ffffff');
      } else if (theme === 'sepia') {
        metaThemeColor.setAttribute('content', '#f8f3e3');
      }
    }
  }, [theme]);

  // Aplicar cor do tema
  useEffect(() => {
    // Executar apenas no cliente para evitar erros de hidratação
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // Remover todas as classes de cor
    root.classList.remove('theme-blue', 'theme-purple', 'theme-green', 'theme-red', 'theme-orange');

    // Adicionar a classe da cor atual
    root.classList.add(`theme-${themeColor}`);

    // Salvar no localStorage
    localStorage.setItem('themeColor', themeColor);

    // Remover variáveis existentes para garantir que não haja conflitos
    root.style.removeProperty('--primary-color');
    root.style.removeProperty('--primary-hover');
    root.style.removeProperty('--primary-color-rgb');

    // Obter as cores do tema selecionado
    const selectedThemeColors = themeColors[themeColor];

    // Aplicar as cores do tema como variáveis CSS
    if (selectedThemeColors) {
      root.style.setProperty('--primary-color', selectedThemeColors.primary);
      root.style.setProperty('--primary-hover', selectedThemeColors.hover);
      root.style.setProperty('--primary-color-rgb', selectedThemeColors.rgb);

      // Aplicar cores em elementos específicos que podem não ser afetados pelas classes CSS
      const buttons = document.querySelectorAll('.bg-indigo-600, .bg-blue-600, .bg-purple-600, .bg-green-600, .bg-red-600, .bg-orange-600');
      buttons.forEach(button => {
        (button as HTMLElement).style.backgroundColor = selectedThemeColors.primary;
      });

      const hoverButtons = document.querySelectorAll('.hover\\:bg-indigo-700, .hover\\:bg-blue-700, .hover\\:bg-purple-700, .hover\\:bg-green-700, .hover\\:bg-red-700, .hover\\:bg-orange-700');
      hoverButtons.forEach(button => {
        button.addEventListener('mouseenter', () => {
          (button as HTMLElement).style.backgroundColor = selectedThemeColors.hover;
        });
        button.addEventListener('mouseleave', () => {
          (button as HTMLElement).style.backgroundColor = selectedThemeColors.primary;
        });
      });

      // Aplicar cores em textos
      const textElements = document.querySelectorAll('.text-indigo-600, .text-blue-600, .text-purple-600, .text-green-600, .text-red-600, .text-orange-600');
      textElements.forEach(element => {
        (element as HTMLElement).style.color = selectedThemeColors.primary;
      });

      // Aplicar cores em textos no modo escuro
      const darkTextElements = document.querySelectorAll('.dark\\:text-indigo-400, .dark\\:text-blue-400, .dark\\:text-purple-400, .dark\\:text-green-400, .dark\\:text-red-400, .dark\\:text-orange-400');
      darkTextElements.forEach(element => {
        (element as HTMLElement).style.color = selectedThemeColors.primary;
      });

      // Aplicar cores em bordas
      const borderElements = document.querySelectorAll('.border-indigo-500, .border-blue-500, .border-purple-500, .border-green-500, .border-red-500, .border-orange-500');
      borderElements.forEach(element => {
        (element as HTMLElement).style.borderColor = selectedThemeColors.primary;
      });

      // Aplicar cores em anéis de foco
      const ringElements = document.querySelectorAll('.focus\\:ring-indigo-500, .focus\\:ring-blue-500, .focus\\:ring-purple-500, .focus\\:ring-green-500, .focus\\:ring-red-500, .focus\\:ring-orange-500');
      ringElements.forEach(element => {
        (element as HTMLElement).style.setProperty('--tw-ring-color', selectedThemeColors.primary);
      });
    } else {
      // Fallback para o tema azul se o tema selecionado não for encontrado
      root.style.setProperty('--primary-color', '#4f46e5');
      root.style.setProperty('--primary-hover', '#4338ca');
      root.style.setProperty('--primary-color-rgb', '79, 70, 229');
    }

    // Forçar uma atualização do DOM para aplicar as mudanças
    document.body.classList.add('theme-updated');
    setTimeout(() => {
      document.body.classList.remove('theme-updated');
    }, 10);

    console.log(`Tema de cor aplicado: ${themeColor}`, selectedThemeColors);
  }, [themeColor]);

  // Função de alternância de tema
  const toggleTheme = () => {
    // Alternar entre os temas disponíveis
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('sepia');
    } else {
      setTheme('light');
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      themeColor,
      setTheme,
      setThemeColor,
      toggleTheme,
      useSystemTheme,
      setUseSystemTheme,
      isSaving
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
