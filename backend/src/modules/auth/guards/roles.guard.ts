import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthenticatedUser } from '../types/authenticated-user.type';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => Reflect.metadata(ROLES_KEY, roles);

export const ADMIN_ROLES = [UserRole.OWNER, UserRole.ADMIN];

export const MANAGEMENT_ROLES = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.MANAGER,
];

export const STAFF_ROLES = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.RECEPTION,
];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const hasRole = () => requiredRoles.some((role) => user.role === role);
    if (!hasRole()) {
      throw new ForbiddenException(`Acesso restrito a: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
