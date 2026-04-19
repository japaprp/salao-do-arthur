import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProductCategoryInput } from '../dto/create-product-category.dto';
import { UpdateProductCategoryDto } from '../dto/update-product-category.dto';

@Injectable()
export class ProductCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateProductCategoryInput) {
    return this.prisma.withTenant(input.tenantId, transaction =>
      transaction.productCategory.create({
        data: {
          tenantId: input.tenantId,
          name: input.name,
          slug: input.slug,
          description: input.description,
          active: input.active ?? true,
          sortOrder: input.sortOrder ?? 0,
        },
      }),
    );
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.productCategory.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    );
  }

  async findActiveByTenant(tenantId: string) {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.productCategory.findMany({
        where: { tenantId, active: true },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    );
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.productCategory.findFirst({
        where: { id, tenantId },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
    );
  }

  async update(id: string, tenantId: string, updateProductCategoryDto: UpdateProductCategoryDto) {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.productCategory.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.productCategory.update({
        where: { id },
        data: updateProductCategoryDto,
      });
    });
  }

  async remove(id: string, tenantId: string) {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.productCategory.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.productCategory.update({
        where: { id },
        data: { active: false },
      });
    });
  }
}
