import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Service } from '@prisma/client';
import { CreateServiceInput } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';

@Injectable()
export class ServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceInput): Promise<Service> {
    return this.prisma.withTenant(createServiceDto.tenantId, transaction =>
      transaction.service.create({
        data: {
          tenantId: createServiceDto.tenantId,
          name: createServiceDto.name,
          description: createServiceDto.description,
          durationMinutes: createServiceDto.durationMinutes,
          price: createServiceDto.price,
          bufferBeforeMinutes: createServiceDto.bufferBeforeMinutes ?? 0,
          bufferAfterMinutes: createServiceDto.bufferAfterMinutes ?? 0,
          parallelAllowed: createServiceDto.parallelAllowed ?? false,
          active: createServiceDto.active ?? true,
        },
      }),
    );
  }

  async findAllByTenant(tenantId: string): Promise<Service[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.service.findMany({
        where: { tenantId, active: true },
        orderBy: { name: 'asc' },
      }),
    );
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<Service | null> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.service.findFirst({
        where: { id, tenantId },
      }),
    );
  }

  async findActiveByTenant(tenantId: string): Promise<Service[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.service.findMany({
        where: { tenantId, active: true },
        orderBy: { name: 'asc' },
      }),
    );
  }

  async update(id: string, tenantId: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.service.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.service.update({
        where: { id },
        data: updateServiceDto,
      });
    });
  }

  async remove(id: string, tenantId: string): Promise<Service> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.service.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.service.update({
        where: { id },
        data: { active: false },
      });
    });
  }
}
