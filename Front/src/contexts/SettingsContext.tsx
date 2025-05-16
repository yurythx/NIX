'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserSettings,
  DEFAULT_SETTINGS,
  loadSettingsFromLocalStorage,
  saveSettingsToLocalStorage,
  saveSettingsToServer,
  syncSettings
} from '../services/api/settings.service';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  isSaving: boolean;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  syncSettingsWithServer: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();

  // Carregar configurações ao inicializar
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // Carregar configurações do localStorage primeiro para uma experiência mais rápida
        const localSettings = loadSettingsFromLocalStorage();
        setSettings(localSettings);

        // Se o usuário estiver autenticado, sincronizar com o servidor
        if (isAuthenticated) {
          try {
            const serverSettings = await syncSettings();
            setSettings(serverSettings);
          } catch (error) {
            console.error('Erro ao sincronizar configurações com o servidor:', error);
            // Já estamos usando as configurações locais, então não precisamos fazer nada aqui
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        // Usar uma referência estável para showNotification
        showNotification('error', 'Não foi possível carregar suas configurações');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
    // Remover showNotification das dependências para evitar loop infinito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Atualizar configurações
  const updateSettings = async (newSettings: Partial<UserSettings>): Promise<void> => {
    setIsSaving(true);
    try {
      // Mesclar as novas configurações com as existentes
      const updatedSettings = {
        ...settings,
        ...newSettings,
        // Mesclar objetos aninhados se eles existirem
        comments: newSettings.comments ? { ...settings.comments, ...newSettings.comments } : settings.comments,
        security: newSettings.security ? { ...settings.security, ...newSettings.security } : settings.security,
        notifications: newSettings.notifications ? { ...settings.notifications, ...newSettings.notifications } : settings.notifications,
        account: newSettings.account ? { ...settings.account, ...newSettings.account } : settings.account,
      };

      // Atualizar o estado
      setSettings(updatedSettings);

      // Salvar no localStorage
      saveSettingsToLocalStorage(updatedSettings);

      // Se o usuário estiver autenticado, salvar no servidor
      if (isAuthenticated) {
        try {
          await saveSettingsToServer(updatedSettings);
        } catch (serverError) {
          console.warn('Erro ao salvar no servidor, mas as configurações foram salvas localmente:', serverError);
          // Não lançar o erro, pois as configurações foram salvas localmente
        }
      }

      // Usar uma referência estável para showNotification
      setTimeout(() => showNotification('success', 'Configurações salvas com sucesso'), 0);
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      // Usar uma referência estável para showNotification
      setTimeout(() => showNotification('error', 'Não foi possível salvar suas configurações'), 0);
      // Não lançar o erro para evitar que a promessa seja rejeitada
    } finally {
      setIsSaving(false);
    }
  };

  // Redefinir configurações para os valores padrão
  const resetSettings = async (): Promise<void> => {
    setIsSaving(true);
    try {
      // Atualizar o estado
      setSettings(DEFAULT_SETTINGS);

      // Salvar no localStorage
      saveSettingsToLocalStorage(DEFAULT_SETTINGS);

      // Se o usuário estiver autenticado, salvar no servidor
      if (isAuthenticated) {
        try {
          await saveSettingsToServer(DEFAULT_SETTINGS);
        } catch (serverError) {
          console.warn('Erro ao salvar no servidor, mas as configurações foram redefinidas localmente:', serverError);
          // Não lançar o erro, pois as configurações foram redefinidas localmente
        }
      }

      // Usar uma referência estável para showNotification
      setTimeout(() => showNotification('success', 'Configurações redefinidas com sucesso'), 0);
    } catch (error) {
      console.error('Erro ao redefinir configurações:', error);
      // Usar uma referência estável para showNotification
      setTimeout(() => showNotification('error', 'Não foi possível redefinir suas configurações'), 0);
      // Não lançar o erro para evitar que a promessa seja rejeitada
    } finally {
      setIsSaving(false);
    }
  };

  // Sincronizar configurações com o servidor
  const syncSettingsWithServer = async (): Promise<void> => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);
    try {
      const serverSettings = await syncSettings();
      setSettings(serverSettings);
      // Usar uma referência estável para showNotification
      setTimeout(() => showNotification('success', 'Configurações sincronizadas com sucesso'), 0);
    } catch (error) {
      console.error('Erro ao sincronizar configurações:', error);
      // Usar uma referência estável para showNotification
      setTimeout(() => showNotification('error', 'Não foi possível sincronizar suas configurações'), 0);
      // Não lançar o erro para evitar que a promessa seja rejeitada
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    settings,
    isLoading,
    isSaving,
    updateSettings,
    resetSettings,
    syncSettingsWithServer,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
