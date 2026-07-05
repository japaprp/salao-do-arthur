import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { AuthenticatedUser } from '../types/authenticated-user.type';

function createContext(user?: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => ({ user })),
    })),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows routes without required roles', () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows users with an accepted role', () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => [UserRole.OWNER, UserRole.ADMIN]),
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
      getAllAndOverride: jest.fn(() => [UserRole.OWNER, UserRole.ADMIN]),
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

  it('checks role metadata on handler and controller class', () => {
    const handler = function handler() {};
    class Controller {}
    const getHandler = jest.fn(() => handler);
    const getClass = jest.fn(() => Controller);
    const getAllAndOverride = jest.fn(() => [UserRole.OWNER, UserRole.ADMIN]);
    const reflector = {
      getAllAndOverride,
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler,
      getClass,
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({
          user: {
            userId: 'user-1',
            email: 'admin@barbeariadoartur.app',
            role: UserRole.ADMIN,
            tenantId: 'tenant-1',
          },
        })),
      })),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(getAllAndOverride).toHaveBeenCalledWith(expect.any(String), [
      handler,
      Controller,
    ]);
  });
});
