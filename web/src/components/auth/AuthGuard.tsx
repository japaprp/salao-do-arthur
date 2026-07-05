import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getHomePathForUser, useAuth } from '@/hooks/useAuth';
import { canAccessAdminPanel } from '@/lib/auth/roles';
import Loading from '@/components/ui/Loading';
import { Box } from '@mui/material';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export const AuthGuard = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo = '/auth/login'
}: AuthGuardProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      } else if (requireAuth && requireAdmin && user && !canAccessAdminPanel(user)) {
        router.push('/client');
      } else if (!requireAuth && isAuthenticated) {
        router.push(getHomePathForUser(user));
      }
    }
  }, [isAuthenticated, isLoading, requireAdmin, requireAuth, redirectTo, router, user]);

  if (!requireAuth) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <Loading size="large" />
      </Box>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null; // Não renderiza nada enquanto redireciona
  }

  if (requireAdmin && user && !canAccessAdminPanel(user)) {
    return null;
  }

  return <>{children}</>;
};
