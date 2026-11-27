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
    paymentWebhookEvent: {
      upsert: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
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

  it('claims a webhook event before processing and releases the claim after success', async () => {
    prisma.paymentWebhookEvent.upsert.mockResolvedValue({
      id: 'webhook-1',
      processedAt: null,
    });
    prisma.paymentWebhookEvent.updateMany.mockResolvedValue({ count: 1 });
    mercadoPagoProvider.getPayment.mockResolvedValue({
      id: 'mp-payment-1',
      status: 'pending',
      externalReference: 'order-1',
      raw: { id: 'mp-payment-1', status: 'pending' },
    });
    prisma.payment.findFirst.mockResolvedValue(null);

    const result = await service.handleMercadoPagoWebhook({
      body: { id: 'event-1', type: 'payment', data: { id: 'mp-payment-1' } },
      headers: { 'x-signature': 'valid', 'x-request-id': 'request-1' },
      query: {},
    });

    expect(result).toEqual({ received: true });
    expect(prisma.paymentWebhookEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'webhook-1',
          processedAt: null,
          OR: expect.any(Array),
        }),
        data: { processingAt: expect.any(Date) },
      }),
    );
    expect(prisma.paymentWebhookEvent.update).toHaveBeenCalledWith({
      where: { id: 'webhook-1' },
      data: { processedAt: expect.any(Date), processingAt: null },
    });
  });

  it('does not process a webhook already claimed by another worker', async () => {
    prisma.paymentWebhookEvent.upsert.mockResolvedValue({
      id: 'webhook-2',
      processedAt: null,
    });
    prisma.paymentWebhookEvent.updateMany.mockResolvedValue({ count: 0 });
    prisma.paymentWebhookEvent.findUnique.mockResolvedValue({ processedAt: null });

    const result = await service.handleMercadoPagoWebhook({
      body: { id: 'event-2', type: 'payment', data: { id: 'mp-payment-2' } },
      headers: { 'x-signature': 'valid', 'x-request-id': 'request-2' },
      query: {},
    });

    expect(result).toEqual({ received: true, processing: true });
    expect(mercadoPagoProvider.getPayment).not.toHaveBeenCalled();
  });

  it('releases a webhook claim when provider processing fails', async () => {
    prisma.paymentWebhookEvent.upsert.mockResolvedValue({
      id: 'webhook-3',
      processedAt: null,
    });
    prisma.paymentWebhookEvent.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    mercadoPagoProvider.getPayment.mockRejectedValue(new Error('provider unavailable'));

    await expect(service.handleMercadoPagoWebhook({
      body: { id: 'event-3', type: 'payment', data: { id: 'mp-payment-3' } },
      headers: { 'x-signature': 'valid', 'x-request-id': 'request-3' },
      query: {},
    })).rejects.toThrow('provider unavailable');

    expect(prisma.paymentWebhookEvent.updateMany).toHaveBeenLastCalledWith({
      where: { id: 'webhook-3', processedAt: null },
      data: { processingAt: null },
    });
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
