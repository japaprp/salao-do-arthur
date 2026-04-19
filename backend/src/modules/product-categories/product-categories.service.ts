import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductCategory } from '@prisma/client';
import { slugify } from '../../common/utils/slugify.util';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoriesRepository } from './repositories/product-categories.repository';

@Injectable()
export class ProductCategoriesService {
  constructor(private readonly productCategoriesRepository: ProductCategoriesRepository) {}

  async create(
    tenantId: string,
    createProductCategoryDto: CreateProductCategoryDto,
  ): Promise<ProductCategory> {
    return this.productCategoriesRepository.create({
      ...createProductCategoryDto,
      tenantId,
      slug: slugify(createProductCategoryDto.slug ?? createProductCategoryDto.name),
    });
  }

  async findAllByTenant(tenantId: string) {
    return this.productCategoriesRepository.findAllByTenant(tenantId);
  }

  async findActiveByTenant(tenantId: string) {
    return this.productCategoriesRepository.findActiveByTenant(tenantId);
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const category = await this.productCategoriesRepository.findByIdAndTenant(id, tenantId);
    if (!category) {
      throw new NotFoundException('Categoria de produto não encontrada.');
    }

    return category;
  }

  async update(
    id: string,
    tenantId: string,
    updateProductCategoryDto: UpdateProductCategoryDto,
  ) {
    await this.findByIdAndTenant(id, tenantId);

    const payload = {
      ...updateProductCategoryDto,
      ...(updateProductCategoryDto.slug || updateProductCategoryDto.name
        ? {
            slug: slugify(updateProductCategoryDto.slug ?? updateProductCategoryDto.name ?? ''),
          }
        : {}),
    };

    return this.productCategoriesRepository.update(id, tenantId, payload);
  }

  async remove(id: string, tenantId: string) {
    await this.findByIdAndTenant(id, tenantId);
    return this.productCategoriesRepository.remove(id, tenantId);
  }
}
