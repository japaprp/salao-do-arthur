import { User } from '@/types';

const USER_STORAGE_KEY = 'user';
const TOKEN_STORAGE_KEY = 'auth_token';

export function readStoredUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function readStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function persistAuthSession(user: User, token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}
