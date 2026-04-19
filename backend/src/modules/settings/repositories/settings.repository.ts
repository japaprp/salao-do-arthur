import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, SalonSettings } from '@prisma/client';

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenantId(tenantId: string): Promise<SalonSettings | null> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.salonSettings.findUnique({
        where: { tenantId },
      }),
    );
  }

  async createDefaults(data: {
    tenantId: string;
    salonName: string;
    locale?: string;
  }): Promise<SalonSettings> {
    return this.prisma.withTenant(data.tenantId, transaction =>
      transaction.salonSettings.create({
        data: {
          tenantId: data.tenantId,
          salonName: data.salonName,
          locale: data.locale ?? 'pt-BR',
        },
      }),
    );
  }

  async update(
    tenantId: string,
    updateSalonSettingsDto: Prisma.SalonSettingsUpdateInput,
  ): Promise<SalonSettings> {
    return this.prisma.withTenant(tenantId, async transaction => {
      const settings = await transaction.salonSettings.findUniqueOrThrow({
        where: { tenantId },
        select: { id: true },
      });

      return transaction.salonSettings.update({
        where: { id: settings.id },
        data: updateSalonSettingsDto,
      });
    });
  }
}
