import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { AdminRegisterForm, AuthResponse, User, UserRole } from '@/types';
import {
  clearAuthSession,
  persistAuthSession,
  readStoredToken,
  readStoredUser,
} from '@/lib/auth/auth-storage';
import { api } from '@/lib/api/client';
import { normalizeUser } from '@/lib/api/normalizers';

interface AuthContextType {
  user: User | null;
  login: (tenantSubdomain: string, email: string, password: string) => Promise<void>;
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

      if (storedUser) {
        setUser(storedUser);
      }

      try {
        const profile = normalizeUser(await api.get('/auth/profile'));
        const latestAccessToken = readStoredToken();
        if (!latestAccessToken) {
          throw new Error('Sessão não restaurada.');
        }

        setUser(profile);
        persistAuthSession(profile, latestAccessToken);
      } catch {
        clearAuthSession();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrapAuth();
  }, []);

  const login = async (tenantSubdomain: string, email: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await api.post<AuthResponse>('/auth/login', {
        tenantSubdomain,
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
  return user?.role === UserRole.CLIENT ? '/client' : '/dashboard';
}

function resolveAuthErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
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
