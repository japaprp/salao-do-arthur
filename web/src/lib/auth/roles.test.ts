import { UserRole } from '@/types';
import { getHomePathForUserRole, isAdminRole } from './roles';

describe('auth role helpers', () => {
  it.each([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTION])(
    'treats %s as an admin panel role',
    (role) => {
      expect(isAdminRole(role)).toBe(true);
      expect(getHomePathForUserRole(role)).toBe('/dashboard');
    },
  );

  it.each([UserRole.CLIENT, UserRole.PROFESSIONAL])(
    'keeps %s outside the admin panel',
    (role) => {
      expect(isAdminRole(role)).toBe(false);
      expect(getHomePathForUserRole(role)).toBe('/client');
    },
  );
});
