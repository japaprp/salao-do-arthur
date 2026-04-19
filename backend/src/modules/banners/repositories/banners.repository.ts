import { Injectable } from '@nestjs/common';
import { BannerPlacement, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBannerInput } from '../dto/create-banner.dto';

@Injectable()
export class BannersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateBannerInput) {
    return this.prisma.withTenant(input.tenantId, transaction =>
      transaction.banner.create({
        data: {
          tenantId: input.tenantId,
          promotionId: input.promotionId,
          imageAssetId: input.imageAssetId,
          mobileImageAssetId: input.mobileImageAssetId,
          title: input.title,
          subtitle: input.subtitle,
          description: input.description,
          placement: input.placement,
          ctaLabel: input.ctaLabel,
          ctaUrl: input.ctaUrl,
          active: input.active ?? true,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          priority: input.priority ?? 0,
        },
        include: { promotion: true },
      }),
    );
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.banner.findMany({
        where: { tenantId },
        include: { promotion: true },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
    );
  }

  async findActiveByTenant(tenantId: string) {
    const now = new Date();

    return this.prisma.withTenant(tenantId, transaction =>
      transaction.banner.findMany({
        where: {
          tenantId,
          active: true,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
        include: { promotion: true },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
    );
  }

  async findByPlacement(tenantId: string, placement: BannerPlacement) {
    const now = new Date();

    return this.prisma.withTenant(tenantId, transaction =>
      transaction.banner.findMany({
        where: {
          tenantId,
          placement,
          active: true,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
        include: { promotion: true },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
    );
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.banner.findFirst({
        where: { id, tenantId },
        include: { promotion: true },
      }),
    );
  }

  async update(id: string, tenantId: string, updateBannerDto: Prisma.BannerUncheckedUpdateInput) {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.banner.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.banner.update({
        where: { id },
        data: updateBannerDto,
        include: { promotion: true },
      });
    });
  }

  async remove(id: string, tenantId: string) {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.banner.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.banner.update({
        where: { id },
        data: { active: false },
        include: { promotion: true },
      });
    });
  }
}
