import { Injectable, NotFoundException } from '@nestjs/common';
import { Banner, BannerPlacement, Prisma } from '@prisma/client';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { BannersRepository } from './repositories/banners.repository';

@Injectable()
export class BannersService {
  constructor(private readonly bannersRepository: BannersRepository) {}

  async create(tenantId: string, createBannerDto: CreateBannerDto): Promise<Banner> {
    return this.bannersRepository.create({
      ...createBannerDto,
      tenantId,
      startsAt: createBannerDto.startsAt ? new Date(createBannerDto.startsAt) : undefined,
      endsAt: createBannerDto.endsAt ? new Date(createBannerDto.endsAt) : undefined,
    });
  }

  async findAllByTenant(tenantId: string) {
    return this.bannersRepository.findAllByTenant(tenantId);
  }

  async findActiveByTenant(tenantId: string) {
    return this.bannersRepository.findActiveByTenant(tenantId);
  }

  async findByPlacement(tenantId: string, placement: BannerPlacement) {
    return this.bannersRepository.findByPlacement(tenantId, placement);
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const banner = await this.bannersRepository.findByIdAndTenant(id, tenantId);
    if (!banner) {
      throw new NotFoundException('Banner não encontrado.');
    }

    return banner;
  }

  async update(id: string, tenantId: string, updateBannerDto: UpdateBannerDto) {
    await this.findByIdAndTenant(id, tenantId);

    const payload: Prisma.BannerUncheckedUpdateInput = {
      ...updateBannerDto,
      ...(updateBannerDto.startsAt ? { startsAt: new Date(updateBannerDto.startsAt) } : {}),
      ...(updateBannerDto.endsAt ? { endsAt: new Date(updateBannerDto.endsAt) } : {}),
    };

    return this.bannersRepository.update(id, tenantId, payload);
  }

  async remove(id: string, tenantId: string) {
    await this.findByIdAndTenant(id, tenantId);
    return this.bannersRepository.remove(id, tenantId);
  }
}
