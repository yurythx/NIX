'use client';

import { ReactNode } from 'react';
import Navbar from './Navbar';
import FloatingMenu from './FloatingMenu';
import { SidebarProvider, useSidebar } from './SidebarProvider';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { ConfigProvider } from '../contexts/ConfigContext';
import ErrorBoundary from './ErrorBoundary';
import AnimatedFooter from './AnimatedFooter';
import LogoutConfirmModal from './auth/LogoutConfirmModal';
import LoginSuccessModal from './auth/LoginSuccessModal';

interface ClientLayoutProps {
  children: ReactNode;
}

function LayoutContent({ children }: ClientLayoutProps) {
  const { isCollapsed } = useSidebar();
  const {
    user,
    isAuthenticated,
    logout,
    showLogoutModal,
    setShowLogoutModal,
    showLoginSuccessModal,
    setShowLoginSuccessModal,
    handleLogout
  } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-900">
      {isAuthenticated && (
        <FloatingMenu
          isAuthenticated={isAuthenticated}
          user={user ? {
            name: user.first_name && user.last_name ?
              `${user.first_name} ${user.last_name}` :
              (user.username || 'Usuário'),
            email: user.email || '',
            avatar: user.avatar || undefined
          } : undefined}
        />
      )}
      <div className="flex-1 flex flex-col bg-purple-50 dark:bg-gray-900 transition-all duration-300">
        <Navbar
          isAuthenticated={isAuthenticated}
          onToggleAuth={() => isAuthenticated ? handleLogout() : null}
        />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
        <AnimatedFooter />
      </div>

      {/* Modal de confirmação de logout */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logout}
      />

      {/* Modal de sucesso de login */}
      <LoginSuccessModal
        isOpen={showLoginSuccessModal}
        onClose={() => setShowLoginSuccessModal(false)}
        username={user?.first_name || user?.username}
      />
    </div>
  );
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider>
            <ConfigProvider>
              <SettingsProvider>
                <SidebarProvider>
                  <LayoutContent>{children}</LayoutContent>
                </SidebarProvider>
              </SettingsProvider>
            </ConfigProvider>
          </ThemeProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}