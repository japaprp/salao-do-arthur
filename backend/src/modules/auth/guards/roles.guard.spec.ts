import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { AuthenticatedUser } from '../types/authenticated-user.type';

function createContext(user?: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => ({ user })),
    })),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows routes without required roles', () => {
    const reflector = {
      get: jest.fn(() => undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows users with an accepted role', () => {
    const reflector = {
      get: jest.fn(() => [UserRole.OWNER, UserRole.ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(
      guard.canActivate(
        createContext({
          userId: 'user-1',
          email: 'owner@barbeariadoartur.app',
          role: UserRole.OWNER,
          tenantId: 'tenant-1',
        }),
      ),
    ).toBe(true);
  });

  it('blocks users without an accepted role', () => {
    const reflector = {
      get: jest.fn(() => [UserRole.OWNER, UserRole.ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() =>
      guard.canActivate(
        createContext({
          userId: 'user-1',
          email: 'cliente@barbeariadoartur.app',
          role: UserRole.CLIENT,
          tenantId: 'tenant-1',
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
