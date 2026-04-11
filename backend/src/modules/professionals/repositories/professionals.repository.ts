import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Professional } from '@prisma/client';
import { CreateProfessionalInput } from '../dto/create-professional.dto';
import { UpdateProfessionalDto } from '../dto/update-professional.dto';

@Injectable()
export class ProfessionalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProfessionalDto: CreateProfessionalInput): Promise<Professional> {
    return this.prisma.withTenant(createProfessionalDto.tenantId, transaction =>
      transaction.professional.create({
        data: {
          userId: createProfessionalDto.userId,
          tenantId: createProfessionalDto.tenantId,
          specialty: createProfessionalDto.specialty,
          commissionPercent: createProfessionalDto.commissionPercent,
          active: createProfessionalDto.active ?? true,
        },
      }),
    );
  }

  async findAllByTenant(tenantId: string): Promise<Professional[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.professional.findMany({
        where: { tenantId, active: true },
        include: { user: true },
      }),
    );
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<Professional | null> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.professional.findFirst({
        where: { id, tenantId },
        include: { user: true },
      }),
    );
  }

  async findByUserId(userId: string): Promise<Professional | null> {
    return this.prisma.professional.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  async findByUserIdAndTenant(userId: string, tenantId: string): Promise<Professional | null> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.professional.findFirst({
        where: { userId, tenantId },
        include: { user: true },
      }),
    );
  }

  async findAvailableForService(serviceId: string, tenantId: string): Promise<Professional[]> {
    // TODO: Implementar lógica de disponibilidade baseada em especialidade/serviço
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.professional.findMany({
        where: { tenantId, active: true },
        include: { user: true },
      }),
    );
  }

  async update(
    id: string,
    tenantId: string,
    updateProfessionalDto: UpdateProfessionalDto,
  ): Promise<Professional> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.professional.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.professional.update({
        where: { id },
        data: updateProfessionalDto,
      });
    });
  }

  async remove(id: string, tenantId: string): Promise<Professional> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.professional.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.professional.update({
        where: { id },
        data: { active: false },
      });
    });
  }
}
