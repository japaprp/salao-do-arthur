import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SyncProfessionalServiceItemDto } from '../dto/sync-professional-services.dto';

const professionalServiceWithRelations = Prisma.validator<Prisma.ProfessionalServiceDefaultArgs>()({
  include: {
    service: true,
  },
});

export type ProfessionalServiceWithRelations = Prisma.ProfessionalServiceGetPayload<
  typeof professionalServiceWithRelations
>;

@Injectable()
export class ProfessionalServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProfessionalIdAndTenant(
    professionalId: string,
    tenantId: string,
  ): Promise<ProfessionalServiceWithRelations[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.professionalService.findMany({
        where: {
          professionalId,
          tenantId,
        },
        include: professionalServiceWithRelations.include,
        orderBy: [{ active: 'desc' }, { sortOrder: 'asc' }, { service: { name: 'asc' } }],
      }),
    );
  }

  async sync(
    professionalId: string,
    tenantId: string,
    items: SyncProfessionalServiceItemDto[],
  ): Promise<ProfessionalServiceWithRelations[]> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.professional.findFirstOrThrow({
        where: { id: professionalId, tenantId },
        select: { id: true },
      });

      const incomingServiceIds = items.map(item => item.serviceId);
      if (incomingServiceIds.length > 0) {
        const matchedServices = await transaction.service.findMany({
          where: {
            tenantId,
            id: { in: incomingServiceIds },
          },
          select: { id: true },
        });

        if (matchedServices.length !== incomingServiceIds.length) {
          const matchedServiceIds = new Set(matchedServices.map(service => service.id));
          const missingServiceIds = incomingServiceIds.filter(serviceId => !matchedServiceIds.has(serviceId));
          throw new NotFoundException(
            `Serviços não encontrados para o tenant informado: ${missingServiceIds.join(', ')}`,
          );
        }
      }

      await Promise.all(
        items.map((item, index) =>
          transaction.professionalService.upsert({
            where: {
              professionalId_serviceId: {
                professionalId,
                serviceId: item.serviceId,
              },
            },
            create: {
              tenantId,
              professionalId,
              serviceId: item.serviceId,
              customPrice: item.customPrice ?? null,
              customDurationMinutes: item.customDurationMinutes ?? null,
              active: item.active ?? true,
              sortOrder: item.sortOrder ?? index,
            },
            update: {
              customPrice: item.customPrice ?? null,
              customDurationMinutes: item.customDurationMinutes ?? null,
              active: item.active ?? true,
              sortOrder: item.sortOrder ?? index,
            },
          }),
        ),
      );

      if (incomingServiceIds.length > 0) {
        await transaction.professionalService.updateMany({
          where: {
            tenantId,
            professionalId,
            serviceId: { notIn: incomingServiceIds },
            active: true,
          },
          data: {
            active: false,
          },
        });
      } else {
        await transaction.professionalService.updateMany({
          where: {
            tenantId,
            professionalId,
            active: true,
          },
          data: {
            active: false,
          },
        });
      }

      return transaction.professionalService.findMany({
        where: {
          professionalId,
          tenantId,
        },
        include: professionalServiceWithRelations.include,
        orderBy: [{ active: 'desc' }, { sortOrder: 'asc' }, { service: { name: 'asc' } }],
      });
    });
  }
}
