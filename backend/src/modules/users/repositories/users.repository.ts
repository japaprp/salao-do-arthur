import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<User | null> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.user.findFirst({
        where: { id, tenantId },
      }),
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByEmailAndTenant(email: string, tenantId: string): Promise<User | null> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.user.findFirst({
        where: { email, tenantId },
      }),
    );
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async createUser(data: {
    email: string;
    phone?: string;
    passwordHash: string;
    name: string;
    role: UserRole;
    tenantId: string;
  }): Promise<User> {
    return this.prisma.withTenant(data.tenantId, transaction =>
      transaction.user.create({
        data: {
          email: data.email,
          phone: data.phone,
          passwordHash: data.passwordHash,
          name: data.name,
          role: data.role,
          tenantId: data.tenantId,
        },
      }),
    );
  }
}
