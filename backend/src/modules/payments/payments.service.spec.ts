/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { OrderStatus, PaymentMethod, PaymentStatus, StockMovementType } from '@prisma/client';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const transaction = {
    payment: {
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    order: {
      update: jest.fn(),
    },
    inventory: {
      update: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
  };

  const prisma = {
    payment: {
      findFirst: jest.fn(),
    },
    withTenant: jest.fn((_tenantId: string, operation: (client: typeof transaction) => unknown) =>
      operation(transaction),
    ),
  };

  const mercadoPagoProvider = {
    validateWebhookSignature: jest.fn(),
    getPayment: jest.fn(),
    cancelPayment: jest.fn(),
    refundPayment: jest.fn(),
  };

  const auditService = {
    record: jest.fn(),
  };

  const loyaltyService = {
    awardPaidOrder: jest.fn(),
  };

  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentsService(
      prisma as never,
      mercadoPagoProvider as never,
      auditService as never,
      loyaltyService as never,
    );
  });

  it('marks an approved Mercado Pago payment as paid and consumes reserved stock', async () => {
    prisma.payment.findFirst.mockResolvedValue(buildPaymentFixture());

    await service.applyProviderPaymentStatus({
      id: 'mp-payment-1',
      status: 'approved',
      externalReference: 'order-1',
      paymentMethod: PaymentMethod.PIX,
      raw: { id: 'mp-payment-1', status: 'approved' },
    });

    expect(transaction.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'payment-1' },
        data: expect.objectContaining({
          status: PaymentStatus.PAID,
          providerReference: 'mp-payment-1',
        }),
      }),
    );
    expect(transaction.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: OrderStatus.PAID, paidAt: expect.any(Date) },
    });
    expect(transaction.inventory.update).toHaveBeenCalledWith({
      where: { productId: 'product-1' },
      data: { reservedQty: 0 },
    });
    expect(transaction.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: StockMovementType.OUT,
          quantity: 2,
          previousQty: 2,
          newQty: 0,
        }),
      }),
    );
    expect(loyaltyService.awardPaidOrder).toHaveBeenCalledWith('tenant-1', 'order-1');
  });

  it('cancels rejected payments and releases reserved stock', async () => {
    prisma.payment.findFirst.mockResolvedValue(buildPaymentFixture());

    await service.applyProviderPaymentStatus({
      id: 'mp-payment-1',
      status: 'rejected',
      statusDetail: 'cc_rejected_other_reason',
      externalReference: 'order-1',
      raw: { id: 'mp-payment-1', status: 'rejected' },
    });

    expect(transaction.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: OrderStatus.CANCELLED, cancelledAt: expect.any(Date) },
    });
    expect(transaction.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orderId: 'order-1', tenantId: 'tenant-1' },
        data: expect.objectContaining({
          status: PaymentStatus.CANCELLED,
          failureReason: 'cc_rejected_other_reason',
        }),
      }),
    );
    expect(transaction.inventory.update).toHaveBeenCalledWith({
      where: { productId: 'product-1' },
      data: {
        reservedQty: 0,
        availableQty: 10,
      },
    });
    expect(transaction.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: StockMovementType.RELEASE,
          quantity: 2,
          previousQty: 8,
          newQty: 10,
        }),
      }),
    );
  });
});

function buildPaymentFixture() {
  return {
    id: 'payment-1',
    tenantId: 'tenant-1',
    provider: 'mercado_pago',
    providerReference: null,
    method: PaymentMethod.PIX,
    status: PaymentStatus.PENDING,
    order: {
      id: 'order-1',
      tenantId: 'tenant-1',
      status: OrderStatus.PENDING_PAYMENT,
      payments: [],
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          quantity: 2,
          product: {
            id: 'product-1',
            trackInventory: true,
            inventory: {
              id: 'inventory-1',
              availableQty: 8,
              reservedQty: 2,
            },
          },
        },
      ],
    },
  };
}
