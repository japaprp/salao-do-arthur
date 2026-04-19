import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ServiceCategory } from '@prisma/client';
import { CreateServiceCategoryInput } from '../dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from '../dto/update-service-category.dto';

@Injectable()
export class ServiceCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateServiceCategoryInput): Promise<ServiceCategory> {
    return this.prisma.withTenant(input.tenantId, transaction =>
      transaction.serviceCategory.create({
        data: {
          tenantId: input.tenantId,
          name: input.name,
          slug: input.slug,
          description: input.description,
          color: input.color,
          icon: input.icon,
          active: input.active ?? true,
          sortOrder: input.sortOrder ?? 0,
        },
      }),
    );
  }

  async findAllByTenant(tenantId: string): Promise<ServiceCategory[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.serviceCategory.findMany({
        where: { tenantId },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    );
  }

  async findActiveByTenant(tenantId: string): Promise<ServiceCategory[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.serviceCategory.findMany({
        where: { tenantId, active: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    );
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<ServiceCategory | null> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.serviceCategory.findFirst({
        where: { id, tenantId },
      }),
    );
  }

  async update(
    id: string,
    tenantId: string,
    updateServiceCategoryDto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategory> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.serviceCategory.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.serviceCategory.update({
        where: { id },
        data: updateServiceCategoryDto,
      });
    });
  }

  async remove(id: string, tenantId: string): Promise<ServiceCategory> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.serviceCategory.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.serviceCategory.update({
        where: { id },
        data: { active: false },
      });
    });
  }
}
