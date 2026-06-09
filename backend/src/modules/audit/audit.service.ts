import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type AuditEventInput = {
  tenantId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  severity?: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditEventInput): Promise<void> {
    await this.prisma.withTenant(input.tenantId, transaction =>
      transaction.auditLog.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          severity: input.severity ?? 'INFO',
          metadata: input.metadata,
        },
        select: { id: true },
      }),
    );
  }
}
