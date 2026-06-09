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

    const paymentDetails = await this.mercadoPagoProvider.getPayment(resourceId);
    await this.applyProviderPaymentStatus(paymentDetails);

    await this.prisma.paymentWebhookEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    });

    return { received: true };
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

    if (payment.status !== PaymentStatus.PAID && payment.status !== PaymentStatus.PARTIALLY_REFUNDED) {
      throw new BadRequestException('Apenas pagamentos aprovados podem ser estornados.');
    }

    if (!payment.providerReference) {
      throw new BadRequestException('Pagamento sem referência do Mercado Pago.');
    }

    const amount = dto.amount;
    const paymentAmount = Number(payment.amount);
    if (amount != null && amount > paymentAmount) {
      throw new BadRequestException('Valor do estorno maior que o pagamento.');
    }

    const refundResult = await this.mercadoPagoProvider.refundPayment({
      providerReference: payment.providerReference,
      amount,
      idempotencyKey: `refund-${payment.id}-${amount ?? 'total'}-${Date.now()}`,
    });

    await this.persistRefund({
      user,
      payment,
      refundResult,
      reason: dto.reason,
      restockItems: dto.restockItems === true,
      isTotalRefund: amount == null || amount >= paymentAmount,
    });

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

    if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(paymentDetails.status)) {
      await this.cancelOrderAndReleaseReservation(payment.order, paymentDetails);
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

    await this.prisma.withTenant(order.tenantId, async transaction => {
      await transaction.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          method: paymentDetails.paymentMethod ?? payment.method,
          providerReference: paymentDetails.id,
          paidAt: new Date(),
          metadata: paymentDetails.raw as Prisma.InputJsonObject,
        },
      });

      await transaction.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID, paidAt: new Date() },
      });

      for (const item of order.items) {
        if (!item.product?.trackInventory || !item.product.inventory) {
          continue;
        }

        const previousQty = item.product.inventory.reservedQty;
        const newQty = Math.max(0, previousQty - item.quantity);
        await transaction.inventory.update({
          where: { productId: item.productId ?? item.product.id },
          data: { reservedQty: newQty },
        });
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
    });
  }

  private async cancelOrderAndReleaseReservation(
    order: OrderWithPayment,
    paymentDetails?: MercadoPagoPaymentDetails,
  ) {
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      return;
    }

    await this.prisma.withTenant(order.tenantId, async transaction => {
      await transaction.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
      });

      await transaction.payment.updateMany({
        where: { orderId: order.id, tenantId: order.tenantId },
        data: {
          status: PaymentStatus.CANCELLED,
          failureReason: paymentDetails?.statusDetail,
          metadata: paymentDetails?.raw as Prisma.InputJsonObject | undefined,
        },
      });

      await this.releaseReservedStock(transaction, order, `Pagamento cancelado`);
    });
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

      const previousReservedQty = item.product.inventory.reservedQty;
      const nextReservedQty = Math.max(0, previousReservedQty - item.quantity);
      const previousAvailableQty = item.product.inventory.availableQty;
      const nextAvailableQty = previousAvailableQty + item.quantity;

      await transaction.inventory.update({
        where: { productId: item.productId ?? item.product.id },
        data: {
          reservedQty: nextReservedQty,
          availableQty: nextAvailableQty,
        },
      });
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
          createdByUserId: input.user.userId,
          amount: input.refundResult.amount,
          reason: input.reason,
          status: input.refundResult.status,
          metadata: input.refundResult.raw as Prisma.InputJsonObject,
        },
      });

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

      if (input.restockItems) {
        for (const item of order.items) {
          if (!item.product?.trackInventory || !item.product.inventory) {
            continue;
          }

          const previousQty = item.product.inventory.availableQty;
          const newQty = previousQty + item.quantity;
          await transaction.inventory.update({
            where: { productId: item.productId ?? item.product.id },
            data: { availableQty: newQty },
          });
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
      action: input.isTotalRefund ? 'payment.refund.total' : 'payment.refund.partial',
      entity: 'Payment',
      entityId: input.payment.id,
      metadata: {
        amount: input.refundResult.amount,
        restockItems: input.restockItems,
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
