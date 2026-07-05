import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

export type TenantPrismaClient = Prisma.TransactionClient;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await withTimeout(
      this.$connect(),
      Number(process.env.PRISMA_CONNECT_TIMEOUT_MS ?? 15000),
      'Timeout ao conectar no banco via Prisma.',
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async withTenant<T>(
    tenantId: string,
    operation: (client: TenantPrismaClient) => Promise<T>,
  ): Promise<T> {
    void tenantId;

    return this.$transaction(async transaction => operation(transaction));
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });
}
