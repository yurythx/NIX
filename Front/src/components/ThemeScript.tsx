'use client';

import { useEffect } from 'react';

/**
 * Componente que aplica o tema salvo ou o tema escuro por padrão
 * Usando useEffect para garantir que o código só execute no cliente
 */
export default function ThemeScript() {
  // Este useEffect será executado apenas no cliente
  useEffect(() => {
    // Verificar se há um tema salvo no localStorage
    const savedTheme = localStorage.getItem('theme');

    // Se houver um tema salvo, use-o, caso contrário, use o tema escuro como padrão
    if (savedTheme) {
      document.documentElement.classList.add(savedTheme);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  return null;
}
