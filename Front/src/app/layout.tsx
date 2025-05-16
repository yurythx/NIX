// app/layout.tsx
import '../styles/globals.css';
import './styles/AnimatedFooter.css';
import './responsive.css'; // Importar estilos de responsividade
import type { Metadata } from 'next';
import ClientLayout from '../components/ClientLayout';
import ThemeScript from '../components/ThemeScript';

export const metadata: Metadata = {
  title: 'Projeto Prometheus',
  description: 'Plataforma de gerenciamento de conteúdo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans bg-purple-50 dark:bg-gray-900">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}