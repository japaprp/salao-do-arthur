import { Injectable } from '@nestjs/common';
import { Prisma, Promotion } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PromotionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: Prisma.PromotionUncheckedCreateInput): Promise<Promotion> {
    return this.prisma.withTenant(input.tenantId, transaction =>
      transaction.promotion.create({
        data: input,
      }),
    );
  }

  async findAllByTenant(tenantId: string): Promise<Promotion[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.promotion.findMany({
        where: { tenantId },
        orderBy: [{ active: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
      }),
    );
  }

  async findActiveByTenant(tenantId: string): Promise<Promotion[]> {
    const now = new Date();

    return this.prisma.withTenant(tenantId, transaction =>
      transaction.promotion.findMany({
        where: {
          tenantId,
          active: true,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
    );
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<Promotion | null> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.promotion.findFirst({
        where: { id, tenantId },
      }),
    );
  }

  async update(
    id: string,
    tenantId: string,
    updatePromotionDto: Prisma.PromotionUncheckedUpdateInput,
  ): Promise<Promotion> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.promotion.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.promotion.update({
        where: { id },
        data: updatePromotionDto,
      });
    });
  }

  async remove(id: string, tenantId: string): Promise<Promotion> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.promotion.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.promotion.update({
        where: { id },
        data: { active: false },
      });
    });
  }
}
