import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  tenantId: string;
}
