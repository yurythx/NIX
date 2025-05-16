'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission?: 'admin' | 'author' | 'authenticated';
  resourceOwnerId?: string | number;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Componente para verificar permissões de acesso
 * 
 * @param children - Conteúdo a ser renderizado se o usuário tiver permissão
 * @param requiredPermission - Permissão necessária ('admin', 'author', 'authenticated')
 * @param resourceOwnerId - ID do proprietário do recurso (para verificar se o usuário é o autor)
 * @param fallback - Conteúdo a ser renderizado se o usuário não tiver permissão
 * @param redirectTo - URL para redirecionar se o usuário não tiver permissão
 */
export default function PermissionGuard({
  children,
  requiredPermission = 'authenticated',
  resourceOwnerId,
  fallback = null,
  redirectTo
}: PermissionGuardProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      let permitted = false;

      switch (requiredPermission) {
        case 'authenticated':
          permitted = isAuthenticated;
          break;
        case 'admin':
          permitted = isAuthenticated && user?.is_staff === true;
          break;
        case 'author':
          permitted = isAuthenticated && (
            user?.is_staff === true || // Admins can edit anything
            (resourceOwnerId !== undefined && user?.id.toString() === resourceOwnerId.toString())
          );
          break;
      }

      setHasPermission(permitted);
      setIsChecking(false);

      // Redirecionar se não tiver permissão e houver um URL de redirecionamento
      if (!permitted && redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [isLoading, isAuthenticated, user, requiredPermission, resourceOwnerId, redirectTo, router]);

  // Enquanto estiver verificando, não renderizar nada
  if (isChecking) {
    return null;
  }

  // Se tiver permissão, renderizar o conteúdo
  if (hasPermission) {
    return <>{children}</>;
  }

  // Se não tiver permissão e não houver redirecionamento, renderizar o fallback
  return <>{fallback}</>;
}
