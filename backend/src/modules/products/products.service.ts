import { Injectable, NotFoundException } from '@nestjs/common';
import { Product, Prisma } from '@prisma/client';
import { toPrismaJson } from '../../common/utils/prisma-json.util';
import { slugify } from '../../common/utils/slugify.util';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsRepository } from './repositories/products.repository';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async create(tenantId: string, createProductDto: CreateProductDto): Promise<Product> {
    const payload: Prisma.ProductUncheckedCreateInput = {
      tenantId,
      categoryId: createProductDto.categoryId,
      name: createProductDto.name,
      slug: slugify(createProductDto.slug ?? createProductDto.name),
      sku: createProductDto.sku,
      description: createProductDto.description,
      shortDescription: createProductDto.shortDescription,
      price: createProductDto.price,
      compareAtPrice: createProductDto.compareAtPrice,
      costPrice: createProductDto.costPrice,
      featured: createProductDto.featured ?? false,
      active: createProductDto.active ?? true,
      shippable: createProductDto.shippable ?? true,
      trackInventory: createProductDto.trackInventory ?? true,
      metadata: createProductDto.metadata ? toPrismaJson(createProductDto.metadata) : undefined,
    };

    return this.productsRepository.create(payload);
  }

  async findAllByTenant(tenantId: string) {
    return this.productsRepository.findAllByTenant(tenantId);
  }

  async findActiveByTenant(tenantId: string) {
    return this.productsRepository.findActiveByTenant(tenantId);
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const product = await this.productsRepository.findByIdAndTenant(id, tenantId);
    if (!product) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return product;
  }

  async update(id: string, tenantId: string, updateProductDto: UpdateProductDto) {
    await this.findByIdAndTenant(id, tenantId);

    const payload: Prisma.ProductUncheckedUpdateInput = {};

    if (updateProductDto.categoryId !== undefined) payload.categoryId = updateProductDto.categoryId;
    if (updateProductDto.name !== undefined) payload.name = updateProductDto.name;
    if (updateProductDto.slug || updateProductDto.name) {
      payload.slug = slugify(updateProductDto.slug ?? updateProductDto.name ?? '');
    }
    if (updateProductDto.sku !== undefined) payload.sku = updateProductDto.sku;
    if (updateProductDto.description !== undefined) payload.description = updateProductDto.description;
    if (updateProductDto.shortDescription !== undefined)
      payload.shortDescription = updateProductDto.shortDescription;
    if (updateProductDto.price !== undefined) payload.price = updateProductDto.price;
    if (updateProductDto.compareAtPrice !== undefined)
      payload.compareAtPrice = updateProductDto.compareAtPrice;
    if (updateProductDto.costPrice !== undefined) payload.costPrice = updateProductDto.costPrice;
    if (updateProductDto.featured !== undefined) payload.featured = updateProductDto.featured;
    if (updateProductDto.active !== undefined) payload.active = updateProductDto.active;
    if (updateProductDto.shippable !== undefined) payload.shippable = updateProductDto.shippable;
    if (updateProductDto.trackInventory !== undefined)
      payload.trackInventory = updateProductDto.trackInventory;
    if (updateProductDto.metadata) payload.metadata = toPrismaJson(updateProductDto.metadata);

    return this.productsRepository.update(id, tenantId, payload);
  }

  async remove(id: string, tenantId: string) {
    await this.findByIdAndTenant(id, tenantId);
    return this.productsRepository.remove(id, tenantId);
  }
}
