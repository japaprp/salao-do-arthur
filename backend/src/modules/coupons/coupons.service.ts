import { Injectable, NotFoundException } from '@nestjs/common';
import { Coupon, Prisma } from '@prisma/client';
import { toPrismaJson } from '../../common/utils/prisma-json.util';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponsRepository } from './repositories/coupons.repository';

@Injectable()
export class CouponsService {
  constructor(private readonly couponsRepository: CouponsRepository) {}

  async create(tenantId: string, createCouponDto: CreateCouponDto): Promise<Coupon> {
    const payload: Prisma.CouponUncheckedCreateInput = {
      tenantId,
      code: this.normalizeCode(createCouponDto.code),
      promotionId: createCouponDto.promotionId,
      description: createCouponDto.description,
      discountType: createCouponDto.discountType,
      discountValue: createCouponDto.discountValue,
      minOrderAmount: createCouponDto.minOrderAmount,
      maxDiscountAmount: createCouponDto.maxDiscountAmount,
      usageLimit: createCouponDto.usageLimit,
      usagePerCustomer: createCouponDto.usagePerCustomer,
      active: createCouponDto.active ?? true,
      startsAt: createCouponDto.startsAt ? new Date(createCouponDto.startsAt) : undefined,
      endsAt: createCouponDto.endsAt ? new Date(createCouponDto.endsAt) : undefined,
      metadata: createCouponDto.metadata ? toPrismaJson(createCouponDto.metadata) : undefined,
    };

    return this.couponsRepository.create(payload);
  }

  async findAllByTenant(tenantId: string) {
    return this.couponsRepository.findAllByTenant(tenantId);
  }

  async findActiveByTenant(tenantId: string) {
    return this.couponsRepository.findActiveByTenant(tenantId);
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const coupon = await this.couponsRepository.findByIdAndTenant(id, tenantId);
    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado.');
    }

    return coupon;
  }

  async update(id: string, tenantId: string, updateCouponDto: UpdateCouponDto) {
    await this.findByIdAndTenant(id, tenantId);

    const payload: Prisma.CouponUncheckedUpdateInput = {};

    if (updateCouponDto.code !== undefined) payload.code = this.normalizeCode(updateCouponDto.code);
    if (updateCouponDto.promotionId !== undefined) payload.promotionId = updateCouponDto.promotionId;
    if (updateCouponDto.description !== undefined) payload.description = updateCouponDto.description;
    if (updateCouponDto.discountType !== undefined) payload.discountType = updateCouponDto.discountType;
    if (updateCouponDto.discountValue !== undefined) payload.discountValue = updateCouponDto.discountValue;
    if (updateCouponDto.minOrderAmount !== undefined)
      payload.minOrderAmount = updateCouponDto.minOrderAmount;
    if (updateCouponDto.maxDiscountAmount !== undefined)
      payload.maxDiscountAmount = updateCouponDto.maxDiscountAmount;
    if (updateCouponDto.usageLimit !== undefined) payload.usageLimit = updateCouponDto.usageLimit;
    if (updateCouponDto.usagePerCustomer !== undefined)
      payload.usagePerCustomer = updateCouponDto.usagePerCustomer;
    if (updateCouponDto.active !== undefined) payload.active = updateCouponDto.active;
    if (updateCouponDto.startsAt) payload.startsAt = new Date(updateCouponDto.startsAt);
    if (updateCouponDto.endsAt) payload.endsAt = new Date(updateCouponDto.endsAt);
    if (updateCouponDto.metadata) payload.metadata = toPrismaJson(updateCouponDto.metadata);

    return this.couponsRepository.update(id, tenantId, payload);
  }

  async remove(id: string, tenantId: string) {
    await this.findByIdAndTenant(id, tenantId);
    return this.couponsRepository.remove(id, tenantId);
  }

  private normalizeCode(value: string) {
    return value.trim().toUpperCase().replace(/\s+/g, '-');
  }
}
