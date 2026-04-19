import { Injectable, NotFoundException } from '@nestjs/common';
import { ServiceCategory } from '@prisma/client';
import { slugify } from '../../common/utils/slugify.util';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { ServiceCategoriesRepository } from './repositories/service-categories.repository';

@Injectable()
export class ServiceCategoriesService {
  constructor(private readonly serviceCategoriesRepository: ServiceCategoriesRepository) {}

  async create(
    tenantId: string,
    createServiceCategoryDto: CreateServiceCategoryDto,
  ): Promise<ServiceCategory> {
    return this.serviceCategoriesRepository.create({
      ...createServiceCategoryDto,
      tenantId,
      slug: slugify(createServiceCategoryDto.slug ?? createServiceCategoryDto.name),
    });
  }

  async findAllByTenant(tenantId: string) {
    return this.serviceCategoriesRepository.findAllByTenant(tenantId);
  }

  async findActiveByTenant(tenantId: string) {
    return this.serviceCategoriesRepository.findActiveByTenant(tenantId);
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const category = await this.serviceCategoriesRepository.findByIdAndTenant(id, tenantId);
    if (!category) {
      throw new NotFoundException('Categoria de serviço não encontrada.');
    }

    return category;
  }

  async update(
    id: string,
    tenantId: string,
    updateServiceCategoryDto: UpdateServiceCategoryDto,
  ) {
    await this.findByIdAndTenant(id, tenantId);

    const payload = {
      ...updateServiceCategoryDto,
      ...(updateServiceCategoryDto.slug || updateServiceCategoryDto.name
        ? {
            slug: slugify(updateServiceCategoryDto.slug ?? updateServiceCategoryDto.name ?? ''),
          }
        : {}),
    };

    return this.serviceCategoriesRepository.update(id, tenantId, payload);
  }

  async remove(id: string, tenantId: string) {
    await this.findByIdAndTenant(id, tenantId);
    return this.serviceCategoriesRepository.remove(id, tenantId);
  }
}
