'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme, themeColors, Theme, ThemeColor } from '../../../contexts/ThemeContext';
import { FiSun, FiMoon, FiBook, FiMonitor, FiCheck, FiLoader, FiSave, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function AppearanceSettingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { 
    theme, 
    themeColor, 
    setTheme, 
    setThemeColor,
    useSystemTheme,
    setUseSystemTheme,
    isSaving
  } = useTheme();

  // Estados locais para preview
  const [previewTheme, setPreviewTheme] = useState<Theme>(theme);
  const [previewColor, setPreviewColor] = useState<ThemeColor>(themeColor);
  const [previewUseSystem, setPreviewUseSystem] = useState(useSystemTheme);
  const [hasChanges, setHasChanges] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Inicializar estados de preview com os valores atuais
  useEffect(() => {
    setPreviewTheme(theme);
    setPreviewColor(themeColor);
    setPreviewUseSystem(useSystemTheme);
  }, [theme, themeColor, useSystemTheme]);

  // Função para aplicar as alterações
  const applyChanges = () => {
    if (previewUseSystem !== useSystemTheme) {
      setUseSystemTheme(previewUseSystem);
    }
    
    if (!previewUseSystem) {
      if (previewTheme !== theme) {
        setTheme(previewTheme);
      }
    }
    
    if (previewColor !== themeColor) {
      setThemeColor(previewColor);
    }
    
    setHasChanges(false);
    setSuccess('Configurações de aparência salvas com sucesso!');
    
    // Limpar mensagem de sucesso após 3 segundos
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };

  // Função para atualizar o tema de preview
  const updatePreviewTheme = (newTheme: Theme) => {
    setPreviewTheme(newTheme);
    setPreviewUseSystem(false);
    setHasChanges(true);
  };

  // Função para atualizar a cor de preview
  const updatePreviewColor = (newColor: ThemeColor) => {
    setPreviewColor(newColor);
    setHasChanges(true);
  };

  // Função para atualizar o uso do tema do sistema
  const updatePreviewUseSystem = (value: boolean) => {
    setPreviewUseSystem(value);
    setHasChanges(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/perfil" className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <FiArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações de Aparência</h1>
      </div>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex items-center">
          <FiCheck className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Modo de Exibição</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Escolha como você prefere visualizar o conteúdo. O modo escuro é ideal para uso noturno e reduz o cansaço visual.
        </p>
        
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
          <button
            onClick={() => updatePreviewUseSystem(true)}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
              previewUseSystem
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FiMonitor className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Sistema</span>
            {previewUseSystem && <FiCheck className="w-4 h-4 mt-1" />}
          </button>
          
          <button
            onClick={() => updatePreviewTheme('light')}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
              previewTheme === 'light' && !previewUseSystem
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FiSun className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Claro</span>
            {previewTheme === 'light' && !previewUseSystem && <FiCheck className="w-4 h-4 mt-1" />}
          </button>
          
          <button
            onClick={() => updatePreviewTheme('dark')}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
              previewTheme === 'dark' && !previewUseSystem
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FiMoon className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Escuro</span>
            {previewTheme === 'dark' && !previewUseSystem && <FiCheck className="w-4 h-4 mt-1" />}
          </button>
          
          <button
            onClick={() => updatePreviewTheme('sepia')}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
              previewTheme === 'sepia' && !previewUseSystem
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FiBook className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Sépia</span>
            {previewTheme === 'sepia' && !previewUseSystem && <FiCheck className="w-4 h-4 mt-1" />}
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Cor do Tema</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Personalize a cor principal do tema para refletir seu estilo.
        </p>
        
        <div className="flex flex-wrap gap-4 mb-4">
          {Object.entries(themeColors).map(([color, values]) => (
            <button
              key={color}
              onClick={() => updatePreviewColor(color as ThemeColor)}
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-transform hover:scale-110 ${
                previewColor === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: values.primary }}
              aria-label={`Tema ${color}`}
            >
              {previewColor === color && <FiCheck className="w-6 h-6 text-white" />}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={applyChanges}
          disabled={!hasChanges || isSaving}
          className={`flex items-center px-5 py-2.5 rounded-md font-medium ${
            hasChanges && !isSaving
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <>
              <FiLoader className="w-5 h-5 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <FiSave className="w-5 h-5 mr-2" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>
    </div>
  );
}
