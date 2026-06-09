import { Injectable } from '@nestjs/common';
import { AppointmentStatus, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';

type FinancePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getOverview(tenantId: string, period: FinancePeriod = 'monthly') {
    const range = getPeriodRange(period);

    return this.prisma.withTenant(tenantId, async transaction => {
      const [
        appointmentRevenue,
        orderRevenue,
        manualIncome,
        expenses,
        commissions,
        pendingCommissions,
        recentTransactions,
      ] = await Promise.all([
        transaction.appointment.aggregate({
          where: {
            tenantId,
            status: AppointmentStatus.COMPLETED,
            finishedAt: { gte: range.start, lt: range.end },
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        transaction.order.aggregate({
          where: {
            tenantId,
            status: { in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
            paidAt: { gte: range.start, lt: range.end },
            deletedAt: null,
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        transaction.transaction.aggregate({
          where: {
            tenantId,
            type: 'INCOME',
            status: 'CONFIRMED',
            recordedAt: { gte: range.start, lt: range.end },
            deletedAt: null,
          },
          _sum: { amount: true },
        }),
        transaction.transaction.aggregate({
          where: {
            tenantId,
            type: 'EXPENSE',
            status: 'CONFIRMED',
            recordedAt: { gte: range.start, lt: range.end },
            deletedAt: null,
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
        transaction.commission.aggregate({
          where: {
            tenantId,
            createdAt: { gte: range.start, lt: range.end },
            deletedAt: null,
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
        transaction.commission.aggregate({
          where: {
            tenantId,
            paid: false,
            deletedAt: null,
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
        transaction.transaction.findMany({
          where: {
            tenantId,
            recordedAt: { gte: range.start, lt: range.end },
            deletedAt: null,
          },
          orderBy: { recordedAt: 'desc' },
          take: 12,
        }),
      ]);

      const revenue =
        decimalToNumber(appointmentRevenue._sum.totalAmount) +
        decimalToNumber(orderRevenue._sum.totalAmount) +
        decimalToNumber(manualIncome._sum.amount);
      const expenseTotal = decimalToNumber(expenses._sum.amount);
      const commissionTotal = decimalToNumber(commissions._sum.amount);
      const netProfit = revenue - expenseTotal - commissionTotal;

      return {
        period,
        range,
        summary: {
          revenue,
          appointmentRevenue: decimalToNumber(appointmentRevenue._sum.totalAmount),
          orderRevenue: decimalToNumber(orderRevenue._sum.totalAmount),
          manualIncome: decimalToNumber(manualIncome._sum.amount),
          expenses: expenseTotal,
          commissions: commissionTotal,
          netProfit,
          appointmentCount: appointmentRevenue._count.id,
          orderCount: orderRevenue._count.id,
          expenseCount: expenses._count.id,
          commissionCount: commissions._count.id,
          pendingCommissionAmount: decimalToNumber(pendingCommissions._sum.amount),
          pendingCommissionCount: pendingCommissions._count.id,
        },
        recentTransactions,
      };
    });
  }

  async createTransaction(user: AuthenticatedUser, dto: CreateFinanceTransactionDto) {
    const transaction = await this.prisma.withTenant(user.tenantId, tx =>
      tx.transaction.create({
        data: {
          tenantId: user.tenantId,
          type: dto.type,
          category: dto.category,
          amount: dto.amount,
          status: 'CONFIRMED',
          description: dto.description,
          recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
        },
      }),
    );

    await this.auditService.record({
      tenantId: user.tenantId,
      userId: user.userId,
      action: dto.type === 'EXPENSE' ? 'finance.expense.create' : 'finance.income.create',
      entity: 'Transaction',
      entityId: transaction.id,
      metadata: { amount: dto.amount, category: dto.category },
    });

    return transaction;
  }

  async recordAppointmentCompletion(tenantId: string, appointmentId: string) {
    await this.prisma.withTenant(tenantId, async transaction => {
      const appointment = await transaction.appointment.findFirst({
        where: { id: appointmentId, tenantId, deletedAt: null },
        include: { professional: true },
      });

      if (!appointment) {
        return;
      }

      const existingCommission = await transaction.commission.findFirst({
        where: { tenantId, appointmentId, professionalId: appointment.professionalId },
        select: { id: true },
      });

      if (!existingCommission) {
        const percentage = Number(appointment.professional.commissionPercent);
        const amount = roundMoney((Number(appointment.totalAmount) * percentage) / 100);
        await transaction.commission.create({
          data: {
            tenantId,
            professionalId: appointment.professionalId,
            appointmentId,
            percentage,
            amount,
            metadata: {
              source: 'appointment_completed',
              appointmentTotal: Number(appointment.totalAmount),
            },
          },
        });
      }

      const existingRevenue = await transaction.transaction.findFirst({
        where: {
          tenantId,
          appointmentId,
          type: 'INCOME',
          category: 'SERVICE',
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!existingRevenue) {
        await transaction.transaction.create({
          data: {
            tenantId,
            appointmentId,
            professionalId: appointment.professionalId,
            type: 'INCOME',
            category: 'SERVICE',
            amount: appointment.totalAmount,
            status: 'CONFIRMED',
            description: 'Atendimento concluido',
            recordedAt: appointment.finishedAt ?? new Date(),
          },
        });
      }
    });
  }
}

function getPeriodRange(period: FinancePeriod) {
  const now = new Date();
  const start =
    period === 'daily'
      ? startOfDay(now)
      : period === 'weekly'
        ? startOfWeek(now)
        : period === 'yearly'
          ? new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
          : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end =
    period === 'daily'
      ? addDays(start, 1)
      : period === 'weekly'
        ? addDays(start, 7)
        : period === 'yearly'
          ? new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0)
          : new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

  return { start, end };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function startOfWeek(date: Date) {
  const start = startOfDay(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(start, diff);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 0, 0, 0, 0);
}

function decimalToNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return value.toNumber();
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
