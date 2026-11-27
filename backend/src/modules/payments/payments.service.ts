import { createHash } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  Payment,
  PaymentStatus,
  Prisma,
  StockMovementType,
  UserRole,
} from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService, TenantPrismaClient } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import {
  MercadoPagoPaymentDetails,
  MercadoPagoRefundResult,
} from './mercado-pago.types';
import { MercadoPagoCheckoutProvider } from './mercado-pago.provider';

const PAYMENT_RESERVATION_MINUTES = 30;
const MERCADO_PAGO_PROVIDER = 'mercado_pago';

type OrderWithPayment = Prisma.OrderGetPayload<{
  include: {
    payments: true;
    items: { include: { product: { include: { inventory: true } } } };
  };
}>;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mercadoPagoProvider: MercadoPagoCheckoutProvider,
    private readonly auditService: AuditService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  get reservationMinutes() {
    return PAYMENT_RESERVATION_MINUTES;
  }

  async getOrderStatus(user: AuthenticatedUser, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId: user.tenantId,
        deletedAt: null,
        ...(user.role === UserRole.CLIENT ? { userId: user.userId } : {}),
      },
      include: { payments: true, items: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    return order;
  }

  async handleMercadoPagoWebhook(input: {
    body: Record<string, unknown>;
    headers: Record<string, string | string[] | undefined>;
    query: Record<string, string | string[] | undefined>;
  }) {
    this.mercadoPagoProvider.validateWebhookSignature({
      xSignature: input.headers['x-signature'] ?? input.headers['X-Signature'],
      xRequestId: input.headers['x-request-id'] ?? input.headers['X-Request-Id'],
      dataId: input.query['data.id'] ?? this.extractBodyDataId(input.body),
    });

    const resourceId = this.toSafeString(
      this.extractBodyDataId(input.body) ?? input.query['data.id'],
    );
    const eventType = this.toSafeString(input.body.type);
    const action =
      input.body.action == null ? undefined : this.toSafeString(input.body.action);
    const eventId = this.toSafeString(
      input.body.id,
      `${action ?? eventType}-${resourceId || this.extractBodyDataId(input.body)}`,
    );

    if (!resourceId || eventType !== 'payment') {
      return { received: true, ignored: true };
    }

    const event = await this.prisma.paymentWebhookEvent.upsert({
      where: {
        provider_eventId: {
          provider: MERCADO_PAGO_PROVIDER,
          eventId,
        },
      },
      create: {
        provider: MERCADO_PAGO_PROVIDER,
        eventId,
        resourceId,
        eventType,
        action,
        payload: input.body as Prisma.InputJsonObject,
      },
      update: {},
    });

    if (event.processedAt) {
      return { received: true, duplicated: true };
    }

    // Claim the event atomically. A stale lease can be reclaimed after a worker crash.
    const claimedAt = new Date();
    const staleLeaseBefore = new Date(claimedAt.getTime() - 5 * 60_000);
    const claim = await this.prisma.paymentWebhookEvent.updateMany({
      where: {
        id: event.id,
        processedAt: null,
        OR: [
          { processingAt: null },
          { processingAt: { lt: staleLeaseBefore } },
        ],
      },
      data: { processingAt: claimedAt },
    });

    if (claim.count === 0) {
      const latestEvent = await this.prisma.paymentWebhookEvent.findUnique({
        where: { id: event.id },
        select: { processedAt: true },
      });
      return latestEvent?.processedAt
        ? { received: true, duplicated: true }
        : { received: true, processing: true };
    }

    try {
      const paymentDetails = await this.mercadoPagoProvider.getPayment(resourceId);
      await this.applyProviderPaymentStatus(paymentDetails);

      await this.prisma.paymentWebhookEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date(), processingAt: null },
      });

      return { received: true };
    } catch (error) {
      // Release the lease so Mercado Pago can retry immediately after transient failures.
      await this.prisma.paymentWebhookEvent.updateMany({
        where: { id: event.id, processedAt: null },
        data: { processingAt: null },
      });
      throw error;
    }
  }

  async cancelPendingOrder(user: AuthenticatedUser, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId: user.tenantId,
        deletedAt: null,
        ...(user.role === UserRole.CLIENT ? { userId: user.userId } : {}),
      },
      include: {
        payments: true,
        items: { include: { product: { include: { inventory: true } } } },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Apenas pedidos pendentes podem ser cancelados.');
    }

    const payment = order.payments[0];
    if (payment?.providerReference) {
      await this.mercadoPagoProvider.cancelPayment(payment.providerReference);
    }

    await this.cancelOrderAndReleaseReservation(order);
    return this.getOrderStatus(user, orderId);
  }

  async refundPayment(user: AuthenticatedUser, paymentId: string, dto: RefundPaymentDto) {
    if (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas OWNER ou ADMIN podem estornar pagamentos.');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, tenantId: user.tenantId, deletedAt: null },
      include: {
        order: {
          include: {
            payments: true,
            items: { include: { product: { include: { inventory: true } } } },
          },
        },
      },
    });

    if (!payment || !payment.order) {
      throw new NotFoundException('Pagamento não encontrado.');
    }

    const amount = dto.amount;
    const idempotencyKey = createHash('sha256')
      .update([
        payment.id,
        amount == null ? 'total' : amount.toFixed(2),
        dto.idempotencyKey?.trim() || dto.reason.trim(),
      ].join(':'))
      .digest('hex');

    const existingRefund = await this.prisma.refund.findUnique({
      where: { idempotencyKey, tenantId: user.tenantId },
      select: { id: true },
    });
    if (existingRefund) {
      return this.prisma.payment.findFirstOrThrow({
        where: { id: payment.id, tenantId: user.tenantId },
        include: { refunds: true, order: { include: { items: true, payments: true } } },
      });
    }

    if (payment.status !== PaymentStatus.PAID && payment.status !== PaymentStatus.PARTIALLY_REFUNDED) {
      throw new BadRequestException('Apenas pagamentos aprovados podem ser estornados.');
    }

    if (!payment.providerReference) {
      throw new BadRequestException('Pagamento sem referência do Mercado Pago.');
    }

    const paymentAmount = Number(payment.amount);
    const priorRefunds = await this.prisma.refund.aggregate({
      where: {
        paymentId: payment.id,
        tenantId: user.tenantId,
        status: { notIn: ['rejected', 'cancelled'] },
      },
      _sum: { amount: true },
    });
    const alreadyRefunded = Number(priorRefunds._sum.amount ?? 0);
    const remainingAmount = Math.max(0, paymentAmount - alreadyRefunded);
    if (remainingAmount <= 0 || (amount != null && amount > remainingAmount)) {
      throw new BadRequestException('Valor do estorno maior que o saldo ainda disponível para estorno.');
    }
    const refundAmount = amount ?? remainingAmount;
    const providerAmount = amount == null && alreadyRefunded === 0 ? undefined : refundAmount;

    const refundResult = await this.mercadoPagoProvider.refundPayment({
      providerReference: payment.providerReference,
      amount: providerAmount,
      idempotencyKey,
    });

    try {
      await this.persistRefund({
        user,
        payment,
        refundResult,
        idempotencyKey,
        reason: dto.reason,
        restockItems: dto.restockItems === true,
        isTotalRefund: refundAmount >= remainingAmount,
      });
    } catch (error) {
      const isUniqueConflict =
        typeof error === 'object'
        && error !== null
        && 'code' in error
        && (error as { code?: string }).code === 'P2002';
      if (!isUniqueConflict) {
        throw error;
      }
      const concurrentRefund = await this.prisma.refund.findUnique({
        where: { idempotencyKey, tenantId: user.tenantId },
        select: { id: true },
      });
      if (!concurrentRefund) {
        throw error;
      }
    }

    return this.prisma.payment.findFirstOrThrow({
      where: { id: payment.id, tenantId: user.tenantId },
      include: { refunds: true, order: { include: { items: true, payments: true } } },
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async reconcileExpiredPendingPayments() {
    const expiredPayments = await this.prisma.payment.findMany({
      where: {
        provider: MERCADO_PAGO_PROVIDER,
        status: PaymentStatus.PENDING,
        expiresAt: { lte: new Date() },
        deletedAt: null,
      },
      include: {
        order: {
          include: {
            payments: true,
            items: { include: { product: { include: { inventory: true } } } },
          },
        },
      },
      take: 25,
      orderBy: { expiresAt: 'asc' },
    });

    for (const payment of expiredPayments) {
      if (!payment.order) {
        continue;
      }

      if (payment.providerReference) {
        try {
          const paymentDetails = await this.mercadoPagoProvider.getPayment(payment.providerReference);
          await this.applyProviderPaymentStatus(paymentDetails);
          continue;
        } catch {
          // If Mercado Pago cannot be reached, keep the payment pending for the next run.
          continue;
        }
      }

      await this.cancelOrderAndReleaseReservation(payment.order);
    }
  }

  async applyProviderPaymentStatus(paymentDetails: MercadoPagoPaymentDetails) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        provider: MERCADO_PAGO_PROVIDER,
        deletedAt: null,
        OR: [
          { providerReference: paymentDetails.id },
          paymentDetails.externalReference
            ? { orderId: paymentDetails.externalReference }
            : { id: '__never__' },
        ],
      },
      include: {
        order: {
          include: {
            payments: true,
            items: { include: { product: { include: { inventory: true } } } },
          },
        },
      },
    });

    if (!payment || !payment.order) {
      return;
    }

    if (paymentDetails.status === 'approved' || paymentDetails.status === 'authorized') {
      await this.confirmPaidOrder(payment.order, payment, paymentDetails);
      return;
    }

    if (paymentDetails.status === 'rejected' || paymentDetails.status === 'cancelled') {
      await this.cancelOrderAndReleaseReservation(payment.order, paymentDetails);
      return;
    }

    if (paymentDetails.status === 'refunded' || paymentDetails.status === 'charged_back') {
      await this.markPaymentReversed(payment.order, payment, paymentDetails);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PENDING,
        providerReference: paymentDetails.id,
        method: paymentDetails.paymentMethod ?? payment.method,
        metadata: paymentDetails.raw as Prisma.InputJsonObject,
      },
    });
  }

  private async confirmPaidOrder(
    order: OrderWithPayment,
    payment: Payment,
    paymentDetails: MercadoPagoPaymentDetails,
  ) {
    if (payment.status === PaymentStatus.PAID && order.status === OrderStatus.PAID) {
      return;
    }

    let settled = false;
    try {
      settled = await this.prisma.withTenant(order.tenantId, async transaction => {
        const paidAt = new Date();
        const orderClaim = await transaction.order.updateMany({
          where: {
            id: order.id,
            tenantId: order.tenantId,
            status: OrderStatus.PENDING_PAYMENT,
          },
          data: { status: OrderStatus.PAID, paidAt },
        });
        if (orderClaim.count === 0) {
          return false;
        }

        const paymentClaim = await transaction.payment.updateMany({
          where: {
            id: payment.id,
            tenantId: order.tenantId,
            status: { in: [PaymentStatus.PENDING, PaymentStatus.AUTHORIZED] },
          },
          data: {
            status: PaymentStatus.PAID,
            method: paymentDetails.paymentMethod ?? payment.method,
            providerReference: paymentDetails.id,
            paidAt,
            metadata: paymentDetails.raw as Prisma.InputJsonObject,
          },
        });
        if (paymentClaim.count === 0) {
          // Throwing rolls back the order claim as well.
          throw new Error('PAYMENT_ALREADY_SETTLED');
        }

        for (const item of order.items) {
        if (!item.product?.trackInventory || !item.product.inventory) {
          continue;
        }

        const productId = item.productId ?? item.product.id;
        const inventoryUpdate = await transaction.inventory.updateMany({
          where: {
            productId,
            tenantId: order.tenantId,
            reservedQty: { gte: item.quantity },
          },
          data: { reservedQty: { decrement: item.quantity } },
        });
        if (inventoryUpdate.count === 0) {
          throw new Error('RESERVED_STOCK_INCONSISTENT');
        }
        const inventoryAfter = await transaction.inventory.findUnique({
          where: { productId },
          select: { id: true, reservedQty: true },
        });
        if (!inventoryAfter) {
          throw new Error('INVENTORY_NOT_FOUND');
        }
        const newQty = inventoryAfter.reservedQty;
        const previousQty = newQty + item.quantity;
        await transaction.stockMovement.create({
          data: {
            tenantId: order.tenantId,
            inventoryId: item.product.inventory.id,
            productId: item.productId ?? item.product.id,
            orderId: order.id,
            type: StockMovementType.OUT,
            quantity: item.quantity,
            previousQty,
            newQty,
            reason: `Pagamento aprovado ${paymentDetails.id}`,
          },
        });
        }
        return true;
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'PAYMENT_ALREADY_SETTLED') {
        return;
      }
      throw error;
    }

    if (settled) {
      await this.loyaltyService.awardPaidOrder(order.tenantId, order.id);
    }
  }

  private async cancelOrderAndReleaseReservation(
    order: OrderWithPayment,
    paymentDetails?: MercadoPagoPaymentDetails,
  ) {
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      return;
    }

    await this.prisma.withTenant(order.tenantId, async transaction => {
      const cancellation = await transaction.order.updateMany({
        where: {
          id: order.id,
          tenantId: order.tenantId,
          status: OrderStatus.PENDING_PAYMENT,
        },
        data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
      });
      if (cancellation.count === 0) {
        return;
      }

      await transaction.payment.updateMany({
        where: {
          orderId: order.id,
          tenantId: order.tenantId,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.AUTHORIZED] },
        },
        data: {
          status: PaymentStatus.CANCELLED,
          failureReason: paymentDetails?.statusDetail,
          metadata: paymentDetails?.raw as Prisma.InputJsonObject | undefined,
        },
      });

      await this.releaseReservedStock(transaction, order, `Pagamento cancelado`);
    });
  }

  private async markPaymentReversed(
    order: OrderWithPayment,
    payment: Payment,
    paymentDetails: MercadoPagoPaymentDetails,
  ) {
    try {
      await this.prisma.withTenant(order.tenantId, async transaction => {
        const reversal = await transaction.order.updateMany({
          where: {
            id: order.id,
            tenantId: order.tenantId,
            status: {
              in: [
                OrderStatus.PAID,
                OrderStatus.PREPARING,
                OrderStatus.READY_FOR_PICKUP,
                OrderStatus.SHIPPED,
                OrderStatus.DELIVERED,
              ],
            },
          },
          data: { status: OrderStatus.REFUNDED },
        });
        if (reversal.count === 0) {
          return;
        }

        const paymentReversal = await transaction.payment.updateMany({
          where: {
            id: payment.id,
            tenantId: order.tenantId,
            status: { in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED] },
          },
          data: {
            status: PaymentStatus.REFUNDED,
            failureReason: paymentDetails.statusDetail ?? paymentDetails.status,
            metadata: paymentDetails.raw as Prisma.InputJsonObject,
          },
        });
        if (paymentReversal.count === 0) {
          throw new Error('PAYMENT_REVERSAL_ALREADY_APPLIED');
        }

        const idempotencyKey = createHash('sha256')
          .update([payment.id, paymentDetails.id, paymentDetails.status].join(':'))
          .digest('hex');
        await transaction.refund.create({
          data: {
            tenantId: order.tenantId,
            paymentId: payment.id,
            idempotencyKey,
            amount: payment.amount,
            reason: paymentDetails.statusDetail ?? paymentDetails.status,
            status: paymentDetails.status,
            metadata: paymentDetails.raw as Prisma.InputJsonObject,
          },
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'PAYMENT_REVERSAL_ALREADY_APPLIED') {
        return;
      }
      throw error;
    }
  }

  private async releaseReservedStock(
    transaction: TenantPrismaClient,
    order: OrderWithPayment,
    reason: string,
  ) {
    for (const item of order.items) {
      if (!item.product?.trackInventory || !item.product.inventory) {
        continue;
      }

      const productId = item.productId ?? item.product.id;
      const inventoryUpdate = await transaction.inventory.updateMany({
        where: {
          productId,
          tenantId: order.tenantId,
          reservedQty: { gte: item.quantity },
        },
        data: {
          reservedQty: { decrement: item.quantity },
          availableQty: { increment: item.quantity },
        },
      });
      if (inventoryUpdate.count === 0) {
        throw new Error('RESERVED_STOCK_INCONSISTENT');
      }
      const inventoryAfter = await transaction.inventory.findUnique({
        where: { productId },
        select: { id: true, availableQty: true },
      });
      if (!inventoryAfter) {
        throw new Error('INVENTORY_NOT_FOUND');
      }
      const nextAvailableQty = inventoryAfter.availableQty;
      const previousAvailableQty = nextAvailableQty - item.quantity;
      await transaction.stockMovement.create({
        data: {
          tenantId: order.tenantId,
          inventoryId: item.product.inventory.id,
          productId: item.productId ?? item.product.id,
          orderId: order.id,
          type: StockMovementType.RELEASE,
          quantity: item.quantity,
          previousQty: previousAvailableQty,
          newQty: nextAvailableQty,
          reason,
        },
      });
    }
  }

  private async persistRefund(input: {
    user: AuthenticatedUser;
    payment: Payment & { order: OrderWithPayment | null };
    refundResult: MercadoPagoRefundResult;
    idempotencyKey: string;
    reason: string;
    restockItems: boolean;
    isTotalRefund: boolean;
  }) {
    const order = input.payment.order;
    if (!order) {
      return;
    }

    await this.prisma.withTenant(input.user.tenantId, async transaction => {
      await transaction.refund.create({
        data: {
          tenantId: input.user.tenantId,
          paymentId: input.payment.id,
          idempotencyKey: input.idempotencyKey,
          createdByUserId: input.user.userId,
          amount: input.refundResult.amount,
          reason: input.reason,
          status: input.refundResult.status,
          metadata: input.refundResult.raw as Prisma.InputJsonObject,
        },
      });

      const refundApproved = input.refundResult.status === 'approved';
      if (refundApproved) {
        await transaction.payment.update({
          where: { id: input.payment.id },
          data: {
            status: input.isTotalRefund
              ? PaymentStatus.REFUNDED
              : PaymentStatus.PARTIALLY_REFUNDED,
          },
        });

        if (input.isTotalRefund) {
          await transaction.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.REFUNDED },
          });
        }
      }

      if (refundApproved && input.restockItems) {
        for (const item of order.items) {
          if (!item.product?.trackInventory || !item.product.inventory) {
            continue;
          }

          const productId = item.productId ?? item.product.id;
          const inventoryUpdate = await transaction.inventory.updateMany({
            where: { productId, tenantId: order.tenantId },
            data: { availableQty: { increment: item.quantity } },
          });
          if (inventoryUpdate.count === 0) {
            throw new Error('INVENTORY_NOT_FOUND');
          }
          const inventoryAfter = await transaction.inventory.findUnique({
            where: { productId },
            select: { id: true, availableQty: true },
          });
          if (!inventoryAfter) {
            throw new Error('INVENTORY_NOT_FOUND');
          }
          const newQty = inventoryAfter.availableQty;
          const previousQty = newQty - item.quantity;
          await transaction.stockMovement.create({
            data: {
              tenantId: order.tenantId,
              inventoryId: item.product.inventory.id,
              productId: item.productId ?? item.product.id,
              orderId: order.id,
              createdByUserId: input.user.userId,
              type: StockMovementType.RETURN,
              quantity: item.quantity,
              previousQty,
              newQty,
              reason: `Estorno: ${input.reason}`,
            },
          });
        }
      }
    });

    await this.auditService.record({
      tenantId: input.user.tenantId,
      userId: input.user.userId,
      action: input.refundResult.status === 'approved'
        ? (input.isTotalRefund ? 'payment.refund.total' : 'payment.refund.partial')
        : 'payment.refund.requested',
      entity: 'Payment',
      entityId: input.payment.id,
      metadata: {
        amount: input.refundResult.amount,
        status: input.refundResult.status,
        restockItems: input.refundResult.status === 'approved' && input.restockItems,
        reason: input.reason,
      },
    });
  }

  private extractBodyDataId(body: Record<string, unknown>): string | undefined {
    const data = body.data;
    if (data && typeof data === 'object' && 'id' in data) {
      return this.toSafeString((data as { id?: unknown }).id);
    }
    return undefined;
  }

  private toSafeString(value: unknown, fallback = ''): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return String(value);
    }
    return fallback;
  }
}
