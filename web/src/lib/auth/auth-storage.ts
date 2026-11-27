import { User } from '@/types';

const STORAGE_PREFIX = 'barbearia_do_artur';
const USER_STORAGE_KEY = `${STORAGE_PREFIX}.user`;
const LEGACY_STORAGE_KEYS = ['user', 'auth_token', `${STORAGE_PREFIX}.auth_token`];
let accessToken: string | null = null;

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
  return accessToken;
}

export function persistAuthSession(user: User, token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  clearLegacyAuthSession();
  accessToken = token;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function updateStoredTokens(token: string): void {
  accessToken = token;
}

export function clearAuthSession(): void {
  accessToken = null;
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(USER_STORAGE_KEY);
  clearLegacyAuthSession();
}

function clearLegacyAuthSession(): void {
  LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
}
