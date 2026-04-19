import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProfessionalInput } from '../dto/create-professional.dto';
import { UpdateProfessionalDto } from '../dto/update-professional.dto';

const professionalWithRelations = Prisma.validator<Prisma.ProfessionalDefaultArgs>()({
  include: {
    user: true,
    services: {
      include: {
        service: true,
      },
      orderBy: [{ active: 'desc' }, { sortOrder: 'asc' }, { service: { name: 'asc' } }],
    },
  },
});

export type ProfessionalWithRelations = Prisma.ProfessionalGetPayload<typeof professionalWithRelations>;

@Injectable()
export class ProfessionalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProfessionalDto: CreateProfessionalInput): Promise<ProfessionalWithRelations> {
    return this.prisma.withTenant(createProfessionalDto.tenantId, transaction =>
      transaction.professional.create({
        data: {
          userId: createProfessionalDto.userId,
          tenantId: createProfessionalDto.tenantId,
          specialty: createProfessionalDto.specialty,
          commissionPercent: createProfessionalDto.commissionPercent,
          active: createProfessionalDto.active ?? true,
        },
        include: professionalWithRelations.include,
      }),
    );
  }

  async findAllByTenant(tenantId: string): Promise<ProfessionalWithRelations[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.professional.findMany({
        where: { tenantId },
        include: professionalWithRelations.include,
        orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
      }),
    );
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<ProfessionalWithRelations | null> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.professional.findFirst({
        where: { id, tenantId },
        include: professionalWithRelations.include,
      }),
    );
  }

  async findByUserId(userId: string): Promise<ProfessionalWithRelations | null> {
    return this.prisma.professional.findUnique({
      where: { userId },
      include: professionalWithRelations.include,
    });
  }

  async findByUserIdAndTenant(
    userId: string,
    tenantId: string,
  ): Promise<ProfessionalWithRelations | null> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.professional.findFirst({
        where: { userId, tenantId },
        include: professionalWithRelations.include,
      }),
    );
  }

  async findAvailableForService(
    serviceId: string,
    tenantId: string,
  ): Promise<ProfessionalWithRelations[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.professional.findMany({
        where: {
          tenantId,
          active: true,
          services: {
            some: {
              serviceId,
              tenantId,
              active: true,
            },
          },
        },
        include: professionalWithRelations.include,
        orderBy: [{ user: { name: 'asc' } }],
      }),
    );
  }

  async update(
    id: string,
    tenantId: string,
    updateProfessionalDto: UpdateProfessionalDto,
  ): Promise<ProfessionalWithRelations> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.professional.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.professional.update({
        where: { id },
        data: updateProfessionalDto,
        include: professionalWithRelations.include,
      });
    });
  }

  async remove(id: string, tenantId: string): Promise<ProfessionalWithRelations> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.professional.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.professional.update({
        where: { id },
        data: { active: false },
        include: professionalWithRelations.include,
      });
    });
  }
}
