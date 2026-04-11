import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Tenant } from '@prisma/client';

@Injectable()
export class TenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async findBySubdomain(subdomain: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { subdomain } });
  }

  async createTenant(data: { name: string; subdomain: string; locale?: string }): Promise<Tenant> {
    return this.prisma.tenant.create({
      data: {
        name: data.name,
        subdomain: data.subdomain,
        locale: data.locale ?? 'pt-BR',
      },
    });
  }
}
