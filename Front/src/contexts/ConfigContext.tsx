'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ConfigContextType {
  config: {
    RECAPTCHA_SITE_KEY?: string;
    THEME?: 'light' | 'dark';
    API_URL?: string;
    ALLOW_ANONYMOUS_COMMENTS?: boolean;
    MAX_COMMENT_DEPTH?: number;
  } | null;
  loading: boolean;
  error: string | null;
}

const ConfigContext = createContext<ConfigContextType>({
  config: null,
  loading: true,
  error: null,
});

export const useConfig = () => useContext(ConfigContext);

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<ConfigContextType['config']>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        
        // Em um ambiente real, você buscaria isso da API
        // Aqui estamos usando valores estáticos para demonstração
        const configData = {
          RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
          THEME: localStorage.getItem('theme') as 'light' | 'dark' || 'light',
          API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
          ALLOW_ANONYMOUS_COMMENTS: true,
          MAX_COMMENT_DEPTH: 3,
        };
        
        setConfig(configData);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
        setError('Falha ao carregar configurações');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
    
    // Listener para mudanças de tema
    const handleThemeChange = () => {
      setConfig(prev => prev ? { ...prev, THEME: localStorage.getItem('theme') as 'light' | 'dark' || 'light' } : null);
    };
    
    window.addEventListener('themeChange', handleThemeChange);
    
    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </ConfigContext.Provider>
  );
};

export default ConfigProvider;
