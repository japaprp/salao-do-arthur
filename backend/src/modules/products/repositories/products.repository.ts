import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Product, Prisma } from '@prisma/client';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: Prisma.ProductUncheckedCreateInput): Promise<Product> {
    return this.prisma.withTenant(input.tenantId, transaction =>
      transaction.product.create({
        data: input,
      }),
    );
  }

  async findAllByTenant(tenantId: string): Promise<Product[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.product.findMany({
        where: { tenantId },
        include: { category: true, inventory: true, images: true },
        orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      }),
    );
  }

  async findActiveByTenant(tenantId: string): Promise<Product[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.product.findMany({
        where: { tenantId, active: true },
        include: { category: true, inventory: true, images: true },
        orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      }),
    );
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<Product | null> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.product.findFirst({
        where: { id, tenantId },
        include: { category: true, inventory: true, images: true },
      }),
    );
  }

  async update(
    id: string,
    tenantId: string,
    updateProductDto: Prisma.ProductUncheckedUpdateInput,
  ): Promise<Product> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.product.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.product.update({
        where: { id },
        data: updateProductDto,
      });
    });
  }

  async remove(id: string, tenantId: string): Promise<Product> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.product.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.product.update({
        where: { id },
        data: { active: false },
      });
    });
  }
}
