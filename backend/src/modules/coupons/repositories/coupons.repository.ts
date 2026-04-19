import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CouponsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: Prisma.CouponUncheckedCreateInput) {
    return this.prisma.withTenant(input.tenantId, transaction =>
      transaction.coupon.create({
        data: input,
        include: { promotion: true },
      }),
    );
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.coupon.findMany({
        where: { tenantId },
        include: { promotion: true },
        orderBy: [{ active: 'desc' }, { code: 'asc' }],
      }),
    );
  }

  async findActiveByTenant(tenantId: string) {
    const now = new Date();

    return this.prisma.withTenant(tenantId, transaction =>
      transaction.coupon.findMany({
        where: {
          tenantId,
          active: true,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
        include: { promotion: true },
        orderBy: [{ code: 'asc' }],
      }),
    );
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.coupon.findFirst({
        where: { id, tenantId },
        include: { promotion: true },
      }),
    );
  }

  async update(id: string, tenantId: string, updateCouponDto: Prisma.CouponUncheckedUpdateInput) {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.coupon.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.coupon.update({
        where: { id },
        data: updateCouponDto,
        include: { promotion: true },
      });
    });
  }

  async remove(id: string, tenantId: string) {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.coupon.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.coupon.update({
        where: { id },
        data: { active: false },
        include: { promotion: true },
      });
    });
  }
}
