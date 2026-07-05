import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { AdminRegisterForm, AuthResponse, User } from '@/types';
import {
  clearAuthSession,
  persistAuthSession,
  readStoredToken,
  readStoredUser,
} from '@/lib/auth/auth-storage';
import { api } from '@/lib/api/client';
import { normalizeUser } from '@/lib/api/normalizers';
import { getHomePathForUserRole } from '@/lib/auth/roles';
import { DEFAULT_TENANT_SUBDOMAIN } from '@/lib/auth/tenant';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    input: Pick<AdminRegisterForm, 'organizationName' | 'name' | 'email' | 'password'>,
  ) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedUser = readStoredUser();
      const storedToken = readStoredToken();

      if (storedUser) {
        setUser(storedUser);
      }

      if (!storedToken) {
        clearAuthSession();
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const profile = normalizeUser(await api.get('/auth/profile'));
        setUser(profile);
        persistAuthSession(profile, storedToken);
      } catch {
        clearAuthSession();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrapAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await api.post<AuthResponse>('/auth/login', {
        tenantSubdomain: DEFAULT_TENANT_SUBDOMAIN,
        email,
        password,
      });

      const authenticatedUser = normalizeUser(response.user);

      setUser(authenticatedUser);
      persistAuthSession(authenticatedUser, response.accessToken);

      await router.push(getHomePathForUser(authenticatedUser));
    } catch (error: unknown) {
      clearAuthSession();
      setUser(null);
      throw new Error(resolveAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    input: Pick<AdminRegisterForm, 'organizationName' | 'name' | 'email' | 'password'>,
  ) => {
    setIsLoading(true);

    try {
      const response = await api.post<AuthResponse>('/auth/register/admin', {
        organizationName: input.organizationName,
        name: input.name,
        email: input.email,
        password: input.password,
      });

      const authenticatedUser = normalizeUser(response.user);
      setUser(authenticatedUser);
      persistAuthSession(authenticatedUser, response.accessToken);
      await router.push('/dashboard');
    } catch (error: unknown) {
      clearAuthSession();
      setUser(null);
      throw new Error(resolveAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Encerrar a sessão local é obrigatório mesmo se a API falhar.
    } finally {
      setUser(null);
      clearAuthSession();
      await router.push('/auth/login');
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function getHomePathForUser(user: User | null): string {
  return getHomePathForUserRole(user?.role);
}

function resolveAuthErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'A API de produção ainda não está respondendo. A web está no ar, mas o login depende do backend no Render com banco MySQL configurado.';
    }

    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message[0] ?? 'Não foi possível autenticar.';
    }

    if (typeof message === 'string') {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Não foi possível autenticar.';
}
