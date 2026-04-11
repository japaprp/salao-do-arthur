import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

export type TenantPrismaClient = Prisma.TransactionClient;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async withTenant<T>(
    tenantId: string,
    operation: (client: TenantPrismaClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async transaction => {
      await transaction.$executeRaw`
        SELECT set_config('app.current_tenant_id', ${tenantId}, true)
      `;

      return operation(transaction);
    });
  }
}
