'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Notification, { NotificationType } from '../components/Notification';

interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string, duration?: number) => void;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const showNotification = (type: NotificationType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, message, duration }]);
    return id;
  };

  const hideNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  // Limpar notificações após o tempo definido
  useEffect(() => {
    if (notifications.length > 0) {
      const notification = notifications[0];
      const timer = setTimeout(() => {
        hideNotification(notification.id);
      }, notification.duration || 5000);

      return () => clearTimeout(timer);
    }
  // Usar apenas o primeiro item da lista como dependência
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications[0]?.id]);

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          duration={notification.duration}
          onClose={() => hideNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
};
