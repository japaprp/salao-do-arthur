/** @jest-environment jsdom */

import { User } from '@/types';
import {
  clearAuthSession,
  persistAuthSession,
  readStoredToken,
  readStoredUser,
  updateStoredTokens,
} from './auth-storage';

describe('auth storage', () => {
  const user = {
    id: 'user-1',
    name: 'Artur',
    email: 'artur@example.test',
    role: 'OWNER',
  } as User;

  beforeEach(() => {
    localStorage.clear();
    clearAuthSession();
  });

  it('keeps access tokens in memory and stores only the user profile', () => {
    persistAuthSession(user, 'access-token-secret');

    expect(readStoredToken()).toBe('access-token-secret');
    expect(readStoredUser()).toEqual(user);
    expect(localStorage.getItem('barbearia_do_artur.auth_token')).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('updates the in-memory token after refresh without persisting it', () => {
    updateStoredTokens('rotated-access-token');

    expect(readStoredToken()).toBe('rotated-access-token');
    expect(localStorage.getItem('barbearia_do_artur.auth_token')).toBeNull();
  });

  it('clears the in-memory token and legacy persisted token values', () => {
    localStorage.setItem('barbearia_do_artur.auth_token', 'old-access-token');
    localStorage.setItem('auth_token', 'legacy-access-token');
    persistAuthSession(user, 'access-token-secret');

    clearAuthSession();

    expect(readStoredToken()).toBeNull();
    expect(localStorage.getItem('barbearia_do_artur.auth_token')).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('barbearia_do_artur.user')).toBeNull();
  });
});
