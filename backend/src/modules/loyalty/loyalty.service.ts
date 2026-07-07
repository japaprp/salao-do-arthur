import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LoyaltyLevel, Prisma, UserRole } from '@prisma/client';
import { PrismaService, TenantPrismaClient } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AdjustLoyaltyDto } from './dto/adjust-loyalty.dto';
import { RedeemLoyaltyDto } from './dto/redeem-loyalty.dto';

const LEVELS: Array<{
  level: LoyaltyLevel;
  minPoints: number;
  cashbackRate: number;
  benefits: string[];
}> = [
  {
    level: LoyaltyLevel.BRONZE,
    minPoints: 0,
    cashbackRate: 0.02,
    benefits: ['Acumulo de pontos em compras e servicos', 'Historico de fidelidade'],
  },
  {
    level: LoyaltyLevel.SILVER,
    minPoints: 500,
    cashbackRate: 0.04,
    benefits: ['Cashback ampliado', 'Prioridade em ofertas de horario'],
  },
  {
    level: LoyaltyLevel.GOLD,
    minPoints: 1500,
    cashbackRate: 0.06,
    benefits: ['Beneficios sazonais', 'Prioridade em campanhas da barbearia'],
  },
  {
    level: LoyaltyLevel.DIAMOND,
    minPoints: 3500,
    cashbackRate: 0.08,
    benefits: ['Melhor cashback', 'Beneficios exclusivos do cliente Diamante'],
  },
];

type LoyaltySettings = {
  enableLoyalty: boolean;
  enableCashback: boolean;
};

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  getLevels() {
    return LEVELS.map(level => ({
      ...level,
      displayName: this.getLevelDisplayName(level.level),
    }));
  }

  async getMine(user: AuthenticatedUser) {
    const client = await this.prisma.client.findFirst({
      where: { userId: user.userId, tenantId: user.tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return this.getClientLoyalty(user.tenantId, client.id);
  }

  async getClientLoyalty(tenantId: string, clientId: string) {
    return this.prisma.withTenant(tenantId, transaction =>
      this.buildClientLoyalty(transaction, tenantId, clientId),
    );
  }

  async awardPaidOrder(tenantId: string, orderId: string) {
    await this.prisma.withTenant(tenantId, async transaction => {
      const order = await transaction.order.findFirst({
        where: { id: orderId, tenantId, clientId: { not: null }, deletedAt: null },
        select: {
          id: true,
          tenantId: true,
          clientId: true,
          totalAmount: true,
        },
      });

      if (!order?.clientId) {
        return;
      }

      const externalKey = `order-paid-${order.id}`;
      const existing = await transaction.loyaltyTransaction.findFirst({
        where: { tenantId, externalKey },
        select: { id: true },
      });

      if (existing) {
        return;
      }

      const settings = await this.getLoyaltySettings(transaction, tenantId);
      const amount = Number(order.totalAmount);

      if (!settings.enableLoyalty) {
        await this.applyTransaction(transaction, {
          tenantId,
          clientId: order.clientId,
          orderId: order.id,
          points: 0,
          amount: 0,
          lifetimeValueIncrement: amount,
          type: 'EARN',
          reason: `Pedido pago ${order.id}`,
          externalKey,
          metadata: {
            orderTotal: amount,
            loyaltyEnabled: false,
            cashbackEnabled: settings.enableCashback,
          },
        });
        return;
      }

      const points = Math.max(1, Math.floor(amount));
      const client = await transaction.client.findFirstOrThrow({
        where: { id: order.clientId, tenantId },
        select: { loyaltyPoints: true },
      });
      const level = this.getLevelForPoints(client.loyaltyPoints + points);
      const cashbackRate = settings.enableCashback ? this.getCashbackRate(level) : 0;
      const cashbackAmount = this.roundMoney(amount * cashbackRate);

      await this.applyTransaction(transaction, {
        tenantId,
        clientId: order.clientId,
        orderId: order.id,
        points,
        amount: cashbackAmount,
        lifetimeValueIncrement: amount,
        type: 'EARN',
        reason: `Pedido pago ${order.id}`,
        externalKey,
        metadata: {
          orderTotal: amount,
          cashbackRate,
          level,
          cashbackEnabled: settings.enableCashback,
        },
      });
    });
  }

  async redeemMine(user: AuthenticatedUser, dto: RedeemLoyaltyDto) {
    const client = await this.prisma.client.findFirst({
      where: { userId: user.userId, tenantId: user.tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return this.redeemClient(user, client.id, dto);
  }

  async redeemClient(user: AuthenticatedUser, clientId: string, dto: RedeemLoyaltyDto) {
    const result = await this.prisma.withTenant(user.tenantId, async transaction => {
      await this.assertClientExists(transaction, user.tenantId, clientId);
      const settings = await this.getLoyaltySettings(transaction, user.tenantId);
      if (!settings.enableLoyalty) {
        throw new BadRequestException('Programa de pontos desabilitado no perfil do Artur.');
      }

      const wallet = await this.ensureWallet(transaction, user.tenantId, clientId);

      if (wallet.pointsBalance < dto.points) {
        throw new BadRequestException('Saldo de pontos insuficiente.');
      }

      await this.applyTransaction(transaction, {
        tenantId: user.tenantId,
        clientId,
        points: -dto.points,
        amount: 0,
        type: 'REDEEM',
        reason: dto.reason ?? 'Resgate de pontos',
        metadata: { actorUserId: user.userId },
      });

      return this.buildClientLoyalty(transaction, user.tenantId, clientId);
    });

    await this.auditService.record({
      tenantId: user.tenantId,
      userId: user.userId,
      action: 'loyalty.redeem',
      entity: 'Client',
      entityId: clientId,
      metadata: { points: dto.points, reason: dto.reason },
    });

    return result;
  }

  async adjustClient(user: AuthenticatedUser, clientId: string, dto: AdjustLoyaltyDto) {
    if (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Ajuste de fidelidade restrito a OWNER ou ADMIN.');
    }

    const result = await this.prisma.withTenant(user.tenantId, async transaction => {
      await this.assertClientExists(transaction, user.tenantId, clientId);
      const settings = await this.getLoyaltySettings(transaction, user.tenantId);
      if (!settings.enableLoyalty && dto.points !== 0) {
        throw new BadRequestException('Programa de pontos desabilitado no perfil do Artur.');
      }
      if (!settings.enableCashback && (dto.amount ?? 0) !== 0) {
        throw new BadRequestException('Cashback desabilitado no perfil do Artur.');
      }

      await this.applyTransaction(transaction, {
        tenantId: user.tenantId,
        clientId,
        points: dto.points,
        amount: dto.amount ?? 0,
        type: 'ADJUSTMENT',
        reason: dto.reason,
        metadata: { actorUserId: user.userId },
      });

      return this.buildClientLoyalty(transaction, user.tenantId, clientId);
    });

    await this.auditService.record({
      tenantId: user.tenantId,
      userId: user.userId,
      action: 'loyalty.adjust',
      entity: 'Client',
      entityId: clientId,
      metadata: { points: dto.points, amount: dto.amount ?? 0, reason: dto.reason },
    });

    return result;
  }

  private async applyTransaction(
    transaction: TenantPrismaClient,
    input: {
      tenantId: string;
      clientId: string;
      appointmentId?: string;
      orderId?: string;
      externalKey?: string;
      points: number;
      amount: number;
      lifetimeValueIncrement?: number;
      type: string;
      reason: string;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    const wallet = await this.ensureWallet(transaction, input.tenantId, input.clientId);
    const client = await transaction.client.findFirstOrThrow({
      where: { id: input.clientId, tenantId: input.tenantId },
      select: { loyaltyPoints: true },
    });
    const nextLifetimePoints = Math.max(0, client.loyaltyPoints + Math.max(0, input.points));
    const nextLevel = this.getLevelForPoints(nextLifetimePoints);

    await transaction.loyaltyTransaction.create({
      data: {
        tenantId: input.tenantId,
        walletId: wallet.id,
        appointmentId: input.appointmentId,
        orderId: input.orderId,
        externalKey: input.externalKey,
        points: input.points,
        amount: input.amount,
        type: input.type,
        reason: input.reason,
        metadata: input.metadata,
      },
    });

    await transaction.loyaltyWallet.update({
      where: { id: wallet.id },
      data: {
        pointsBalance: { increment: input.points },
        cashbackBalance: { increment: input.amount },
        currentLevel: nextLevel,
      },
    });

    await transaction.client.update({
      where: { id: input.clientId },
      data: {
        loyaltyPoints: { increment: Math.max(0, input.points) },
        lifetimeValue: { increment: Math.max(0, input.lifetimeValueIncrement ?? 0) },
        loyaltyLevel: nextLevel,
      },
    });
  }

  private async buildClientLoyalty(
    transaction: TenantPrismaClient,
    tenantId: string,
    clientId: string,
  ) {
    const client = await transaction.client.findFirst({
      where: { id: clientId, tenantId, deletedAt: null },
      include: {
        user: true,
        loyaltyWallet: {
          include: {
            loyaltyTransactions: {
              orderBy: { createdAt: 'desc' },
              take: 25,
            },
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    const wallet = client.loyaltyWallet ?? (await this.ensureWallet(transaction, tenantId, clientId));
    const currentLevel = wallet.currentLevel;
    const settings = await this.getLoyaltySettings(transaction, tenantId);
    const cashbackRate = settings.enableCashback ? this.getCashbackRate(currentLevel) : 0;

    return {
      client,
      wallet,
      currentLevel,
      displayLevel: this.getLevelDisplayName(currentLevel),
      cashbackRate,
      benefits: this.getBenefits(currentLevel),
      nextLevel: this.getNextLevel(client.loyaltyPoints),
      transactions: client.loyaltyWallet?.loyaltyTransactions ?? [],
      settings,
    };
  }

  private async assertClientExists(
    transaction: TenantPrismaClient,
    tenantId: string,
    clientId: string,
  ) {
    const client = await transaction.client.findFirst({
      where: { id: clientId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }
  }

  private async ensureWallet(
    transaction: TenantPrismaClient,
    tenantId: string,
    clientId: string,
  ) {
    return transaction.loyaltyWallet.upsert({
      where: { clientId },
      create: {
        tenantId,
        clientId,
        currentLevel: LoyaltyLevel.BRONZE,
      },
      update: {},
    });
  }

  private async getLoyaltySettings(
    transaction: TenantPrismaClient,
    tenantId: string,
  ): Promise<LoyaltySettings> {
    const settings = await transaction.salonSettings.findUnique({
      where: { tenantId },
      select: { enableLoyalty: true, enableCashback: true },
    });

    return {
      enableLoyalty: settings?.enableLoyalty ?? true,
      enableCashback: settings?.enableCashback ?? true,
    };
  }

  private getLevelForPoints(points: number): LoyaltyLevel {
    return LEVELS.reduce<LoyaltyLevel>(
      (current, level) => (points >= level.minPoints ? level.level : current),
      LoyaltyLevel.BRONZE,
    );
  }

  private getNextLevel(points: number) {
    const next = LEVELS.find(level => points < level.minPoints);
    return next
      ? {
          level: next.level,
          displayName: this.getLevelDisplayName(next.level),
          minPoints: next.minPoints,
          pointsRemaining: next.minPoints - points,
        }
      : null;
  }

  private getCashbackRate(level: LoyaltyLevel) {
    return LEVELS.find(item => item.level === level)?.cashbackRate ?? 0.02;
  }

  private getBenefits(level: LoyaltyLevel) {
    return LEVELS.find(item => item.level === level)?.benefits ?? [];
  }

  private getLevelDisplayName(level: LoyaltyLevel) {
    const labels: Record<LoyaltyLevel, string> = {
      BRONZE: 'Bronze',
      SILVER: 'Prata',
      GOLD: 'Ouro',
      DIAMOND: 'Diamante',
    };

    return labels[level];
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }
}
