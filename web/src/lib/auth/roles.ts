import { User, UserRole } from '@/types';

export const ADMIN_PANEL_ROLES = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.RECEPTION,
] as const;

export function isAdminRole(role?: UserRole | null): boolean {
  return role != null && ADMIN_PANEL_ROLES.includes(role as (typeof ADMIN_PANEL_ROLES)[number]);
}

export function canAccessAdminPanel(user?: User | null): boolean {
  return isAdminRole(user?.role);
}

export function getHomePathForUserRole(role?: UserRole | null): string {
  return isAdminRole(role) ? '/dashboard' : '/client';
}
