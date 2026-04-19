import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Client, Prisma } from '@prisma/client';
import { CreateClientInput } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';

@Injectable()
export class ClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClientDto: CreateClientInput): Promise<Client> {
    const data: Prisma.ClientUncheckedCreateInput = {
      userId: createClientDto.userId,
      tenantId: createClientDto.tenantId,
      loyaltyPoints: createClientDto.loyaltyPoints ?? 0,
      lifetimeValue: createClientDto.lifetimeValue ?? 0,
      favoriteProfessionalId: createClientDto.favoriteProfessionalId,
      preferences: createClientDto.preferences as Prisma.InputJsonValue | undefined,
    };

    return this.prisma.withTenant(createClientDto.tenantId, transaction =>
      transaction.client.create({
        data,
      }),
    );
  }

  async findAllByTenant(tenantId: string): Promise<Client[]> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.client.findMany({
        where: { tenantId },
        include: {
          user: true,
          favoriteProfessional: {
            include: { user: true },
          },
          loyaltyWallet: true,
        },
      }),
    );
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<Client | null> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.client.findFirst({
        where: { id, tenantId },
        include: {
          user: true,
          favoriteProfessional: {
            include: { user: true },
          },
          loyaltyWallet: true,
          appointments: {
            include: {
              professional: {
                include: { user: true },
              },
              service: true,
            },
            orderBy: { scheduledAt: 'desc' },
            take: 10,
          },
        },
      }),
    );
  }

  async findByUserId(userId: string): Promise<Client | null> {
    return this.prisma.client.findUnique({
      where: { userId },
      include: {
        user: true,
        favoriteProfessional: {
          include: { user: true },
        },
        loyaltyWallet: true,
      },
    });
  }

  async findByUserIdAndTenant(userId: string, tenantId: string): Promise<Client | null> {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.client.findFirst({
        where: { userId, tenantId },
        include: {
          user: true,
          favoriteProfessional: {
            include: { user: true },
          },
          loyaltyWallet: {
            include: {
              loyaltyTransactions: {
                orderBy: { createdAt: 'desc' },
                take: 5,
              },
            },
          },
          appointments: {
            include: {
              professional: {
                include: { user: true },
              },
              service: true,
            },
            orderBy: { scheduledAt: 'desc' },
            take: 5,
          },
        },
      }),
    );
  }

  async update(id: string, tenantId: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const data: Prisma.ClientUncheckedUpdateInput = {};

    if (updateClientDto.favoriteProfessionalId !== undefined) {
      data.favoriteProfessionalId = updateClientDto.favoriteProfessionalId;
    }

    if (updateClientDto.preferences !== undefined) {
      data.preferences = updateClientDto.preferences as Prisma.InputJsonValue;
    }

    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.client.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.client.update({
        where: { id },
        data,
      });
    });
  }

  async updateLoyaltyPoints(id: string, tenantId: string, points: number): Promise<Client> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.client.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.client.update({
        where: { id },
        data: { loyaltyPoints: { increment: points } },
      });
    });
  }

  async updateLifetimeValue(id: string, tenantId: string, value: number): Promise<Client> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.client.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.client.update({
        where: { id },
        data: { lifetimeValue: { increment: value } },
      });
    });
  }

  async remove(id: string, tenantId: string): Promise<Client> {
    return this.prisma.withTenant(tenantId, async transaction => {
      await transaction.client.findFirstOrThrow({
        where: { id, tenantId },
        select: { id: true },
      });

      return transaction.client.delete({
        where: { id },
      });
    });
  }
}
