'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Iniciar com a sidebar minimizada
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      // Em telas muito pequenas, sempre colapsar
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
      // Em telas médias, manter colapsado por padrão
      else if (window.innerWidth < 1280) {
        // Não alterar o estado atual, apenas garantir que está colapsado inicialmente
        if (!localStorage.getItem('sidebarState')) {
          setIsCollapsed(true);
        }
      }
      // Em telas grandes, podemos usar a preferência do usuário
      else {
        // Se não houver preferência salva, manter colapsado por padrão
        if (!localStorage.getItem('sidebarState')) {
          setIsCollapsed(true);
        }
      }
    };

    // Carregar preferência do usuário
    const savedState = localStorage.getItem('sidebarState');
    if (savedState) {
      setIsCollapsed(savedState === 'collapsed');
    }

    // Verifica o tamanho inicial
    handleResize();

    // Adiciona o listener
    window.addEventListener('resize', handleResize);

    // Remove o listener quando o componente é desmontado
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    // Agora o botão apenas alterna entre mostrar e esconder o menu flutuante
    setIsCollapsed(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}