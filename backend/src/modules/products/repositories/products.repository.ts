import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, StockMovementType } from '@prisma/client';
import { ProductInventoryDto } from '../dto/product-inventory.dto';

const productInclude = {
  category: true,
  inventory: true,
  images: true,
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    input: Prisma.ProductUncheckedCreateInput,
    inventoryDto?: ProductInventoryDto,
    createdByUserId?: string,
  ): Promise<ProductWithRelations> {
    return this.prisma.withTenant(input.tenantId, async transaction => {
      const product = await transaction.product.create({
        data: input,
      });

      if (input.trackInventory !== false) {
        const availableQty = inventoryDto?.availableQty ?? 0;
        const inventory = await transaction.inventory.create({
          data: {
            tenantId: input.tenantId,
            productId: product.id,
            availableQty,
            reorderPoint: inventoryDto?.reorderPoint ?? 0,
            safetyStock: inventoryDto?.safetyStock ?? 0,
          },
        });

        if (availableQty > 0) {
          await transaction.stockMovement.create({
            data: {
              tenantId: input.tenantId,
              inventoryId: inventory.id,
              productId: product.id,
              createdByUserId,
              type: StockMovementType.IN,
              quantity: availableQty,
              previousQty: 0,
              newQty: availableQty,
              reason: 'Entrada inicial pelo painel da lojinha.',
            },
          });
        }
      }

      return transaction.product.findFirstOrThrow({
        where: { id: product.id, tenantId: input.tenantId },
        include: productInclude,
      });
    });
  }

  async findAllByTenant(tenantId: string): Promise<ProductWithRelations[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.product.findMany({
        where: { tenantId },
        include: productInclude,
        orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      }),
    );
  }

  async findActiveByTenant(tenantId: string): Promise<ProductWithRelations[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.product.findMany({
        where: { tenantId, active: true },
        include: productInclude,
        orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      }),
    );
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<ProductWithRelations | null> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.product.findFirst({
        where: { id, tenantId },
        include: productInclude,
      }),
    );
  }

  async update(
    id: string,
    tenantId: string,
    updateProductDto: Prisma.ProductUncheckedUpdateInput,
    inventoryDto?: ProductInventoryDto,
    createdByUserId?: string,
  ): Promise<ProductWithRelations> {
    return this.prisma.withTenant(tenantId, async transaction => {
      const existing = await transaction.product.findFirstOrThrow({
        where: { id, tenantId },
        include: { inventory: true },
      });

      await transaction.product.update({
        where: { id },
        data: updateProductDto,
      });

      const trackInventory = resolveNextTrackInventory(
        existing.trackInventory,
        updateProductDto.trackInventory,
      );

      if (trackInventory && inventoryDto) {
        const previousQty = existing.inventory?.availableQty ?? 0;
        const nextQty = inventoryDto.availableQty ?? previousQty;
        const inventoryData = {
          availableQty: nextQty,
          reorderPoint: inventoryDto.reorderPoint ?? existing.inventory?.reorderPoint ?? 0,
          safetyStock: inventoryDto.safetyStock ?? existing.inventory?.safetyStock ?? 0,
        };

        const inventory = existing.inventory
          ? await transaction.inventory.update({
              where: { id: existing.inventory.id },
              data: inventoryData,
            })
          : await transaction.inventory.create({
              data: {
                tenantId,
                productId: id,
                ...inventoryData,
              },
            });

        if (nextQty !== previousQty) {
          await transaction.stockMovement.create({
            data: {
              tenantId,
              inventoryId: inventory.id,
              productId: id,
              createdByUserId,
              type: StockMovementType.ADJUSTMENT,
              quantity: Math.abs(nextQty - previousQty),
              previousQty,
              newQty: nextQty,
              reason: 'Ajuste manual pelo painel da lojinha.',
            },
          });
        }
      }

      return transaction.product.findFirstOrThrow({
        where: { id, tenantId },
        include: productInclude,
      });
    });
  }

  async remove(id: string, tenantId: string): Promise<ProductWithRelations> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.product.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.product.update({
        where: { id },
        data: { active: false },
        include: productInclude,
      });
    });
  }
}

function resolveNextTrackInventory(
  current: boolean,
  value: Prisma.ProductUncheckedUpdateInput['trackInventory'],
) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value && typeof value === 'object' && 'set' in value) {
    return value.set ?? current;
  }

  return current;
}
