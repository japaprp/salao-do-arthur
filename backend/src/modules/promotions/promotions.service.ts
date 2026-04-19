import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Promotion } from '@prisma/client';
import { toPrismaJson } from '../../common/utils/prisma-json.util';
import { slugify } from '../../common/utils/slugify.util';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionsRepository } from './repositories/promotions.repository';

@Injectable()
export class PromotionsService {
  constructor(private readonly promotionsRepository: PromotionsRepository) {}

  async create(tenantId: string, createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    const payload: Prisma.PromotionUncheckedCreateInput = {
      tenantId,
      name: createPromotionDto.name,
      slug: slugify(createPromotionDto.slug ?? createPromotionDto.name),
      description: createPromotionDto.description,
      type: createPromotionDto.type,
      scope: createPromotionDto.scope ?? undefined,
      active: createPromotionDto.active ?? true,
      autoApply: createPromotionDto.autoApply ?? false,
      priority: createPromotionDto.priority ?? 0,
      usageLimit: createPromotionDto.usageLimit,
      startsAt: createPromotionDto.startsAt ? new Date(createPromotionDto.startsAt) : undefined,
      endsAt: createPromotionDto.endsAt ? new Date(createPromotionDto.endsAt) : undefined,
      criteria: createPromotionDto.criteria
        ? toPrismaJson(createPromotionDto.criteria)
        : undefined,
      benefit: createPromotionDto.benefit ? toPrismaJson(createPromotionDto.benefit) : undefined,
    };

    return this.promotionsRepository.create(payload);
  }

  async findAllByTenant(tenantId: string) {
    return this.promotionsRepository.findAllByTenant(tenantId);
  }

  async findActiveByTenant(tenantId: string) {
    return this.promotionsRepository.findActiveByTenant(tenantId);
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const promotion = await this.promotionsRepository.findByIdAndTenant(id, tenantId);
    if (!promotion) {
      throw new NotFoundException('Promoção não encontrada.');
    }

    return promotion;
  }

  async update(id: string, tenantId: string, updatePromotionDto: UpdatePromotionDto) {
    await this.findByIdAndTenant(id, tenantId);

    const payload: Prisma.PromotionUncheckedUpdateInput = {};

    if (updatePromotionDto.name !== undefined) payload.name = updatePromotionDto.name;
    if (updatePromotionDto.description !== undefined)
      payload.description = updatePromotionDto.description;
    if (updatePromotionDto.type !== undefined) payload.type = updatePromotionDto.type;
    if (updatePromotionDto.scope !== undefined) payload.scope = updatePromotionDto.scope;
    if (updatePromotionDto.active !== undefined) payload.active = updatePromotionDto.active;
    if (updatePromotionDto.autoApply !== undefined) payload.autoApply = updatePromotionDto.autoApply;
    if (updatePromotionDto.priority !== undefined) payload.priority = updatePromotionDto.priority;
    if (updatePromotionDto.usageLimit !== undefined) payload.usageLimit = updatePromotionDto.usageLimit;
    if (updatePromotionDto.slug || updatePromotionDto.name) {
      payload.slug = slugify(updatePromotionDto.slug ?? updatePromotionDto.name ?? '');
    }
    if (updatePromotionDto.startsAt) payload.startsAt = new Date(updatePromotionDto.startsAt);
    if (updatePromotionDto.endsAt) payload.endsAt = new Date(updatePromotionDto.endsAt);
    if (updatePromotionDto.criteria) payload.criteria = toPrismaJson(updatePromotionDto.criteria);
    if (updatePromotionDto.benefit) payload.benefit = toPrismaJson(updatePromotionDto.benefit);

    return this.promotionsRepository.update(id, tenantId, payload);
  }

  async remove(id: string, tenantId: string) {
    await this.findByIdAndTenant(id, tenantId);
    return this.promotionsRepository.remove(id, tenantId);
  }
}
