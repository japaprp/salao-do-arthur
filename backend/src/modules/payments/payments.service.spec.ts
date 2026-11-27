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
      updateMany: jest.fn(),
    },
    inventory: {
      update: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
    refund: {
      create: jest.fn(),
    },
  };

  const prisma = {
    payment: {
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
    },
    refund: {
      findUnique: jest.fn(),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
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
    transaction.order.updateMany.mockResolvedValue({ count: 1 });
    transaction.payment.updateMany.mockResolvedValue({ count: 1 });
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

  it('uses a stable idempotency key when creating a refund', async () => {
    const payment = buildPaymentFixture();
    payment.status = PaymentStatus.PAID;
    payment.providerReference = 'mp-payment-1';
    payment.amount = 100;
    prisma.payment.findFirst.mockResolvedValue(payment);
    prisma.refund.findUnique.mockResolvedValue(null);
    prisma.payment.findFirstOrThrow.mockResolvedValue({ id: 'payment-1' });
    mercadoPagoProvider.refundPayment.mockResolvedValue({
      id: 'mp-refund-1',
      status: 'approved',
      amount: 20,
      raw: { id: 'mp-refund-1', status: 'approved' },
    });

    await service.refundPayment(
      { userId: 'owner-1', tenantId: 'tenant-1', role: 'OWNER' } as never,
      'payment-1',
      { amount: 20, reason: 'Solicitação do cliente', restockItems: false },
    );

    expect(mercadoPagoProvider.refundPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        providerReference: 'mp-payment-1',
        amount: 20,
        idempotencyKey: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
    expect(transaction.refund.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          idempotencyKey: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      }),
    );
  });

  it('rejects a partial refund larger than the remaining refundable balance', async () => {
    const payment = buildPaymentFixture();
    payment.status = PaymentStatus.PARTIALLY_REFUNDED;
    payment.providerReference = 'mp-payment-1';
    prisma.payment.findFirst.mockResolvedValue(payment);
    prisma.refund.findUnique.mockResolvedValue(null);
    prisma.refund.aggregate.mockResolvedValue({ _sum: { amount: 80 } });

    await expect(service.refundPayment(
      { userId: 'owner-1', tenantId: 'tenant-1', role: 'OWNER' } as never,
      'payment-1',
      { amount: 30, reason: 'Novo pedido de estorno' },
    )).rejects.toThrow('saldo ainda disponível');

    expect(mercadoPagoProvider.refundPayment).not.toHaveBeenCalled();
  });

  it('does not mark a payment refunded before the provider approves it', async () => {
    const payment = buildPaymentFixture();
    payment.status = PaymentStatus.PAID;
    payment.providerReference = 'mp-payment-1';
    prisma.payment.findFirst.mockResolvedValue(payment);
    prisma.refund.findUnique.mockResolvedValue(null);
    prisma.payment.findFirstOrThrow.mockResolvedValue({ id: 'payment-1' });
    mercadoPagoProvider.refundPayment.mockResolvedValue({
      id: 'mp-refund-pending',
      status: 'in_process',
      amount: 20,
      raw: { id: 'mp-refund-pending', status: 'in_process' },
    });

    await service.refundPayment(
      { userId: 'owner-1', tenantId: 'tenant-1', role: 'OWNER' } as never,
      'payment-1',
      { amount: 20, reason: 'Solicitação do cliente', restockItems: true },
    );

    expect(transaction.refund.create).toHaveBeenCalled();
    expect(transaction.payment.update).not.toHaveBeenCalled();
    expect(transaction.order.update).not.toHaveBeenCalled();
    expect(transaction.inventory.update).not.toHaveBeenCalled();
  });

  it('does not submit an identical refund request twice', async () => {
    const payment = buildPaymentFixture();
    payment.status = PaymentStatus.PAID;
    payment.providerReference = 'mp-payment-1';
    payment.amount = 100;
    prisma.payment.findFirst.mockResolvedValue(payment);
    prisma.refund.findUnique.mockResolvedValue({ id: 'refund-existing' });
    prisma.payment.findFirstOrThrow.mockResolvedValue({ id: 'payment-1' });

    await service.refundPayment(
      { userId: 'owner-1', tenantId: 'tenant-1', role: 'OWNER' } as never,
      'payment-1',
      { amount: 20, reason: 'Solicitação do cliente', restockItems: false },
    );

    expect(mercadoPagoProvider.refundPayment).not.toHaveBeenCalled();
    expect(transaction.refund.create).not.toHaveBeenCalled();
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

    expect(transaction.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'order-1',
        tenantId: 'tenant-1',
        status: OrderStatus.PENDING_PAYMENT as OrderStatus,
      },
      data: { status: OrderStatus.PAID, paidAt: expect.any(Date) },
    });
    expect(transaction.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'payment-1',
          tenantId: 'tenant-1',
          status: { in: [PaymentStatus.PENDING, PaymentStatus.AUTHORIZED] },
        },
        data: expect.objectContaining({
          status: PaymentStatus.PAID,
          providerReference: 'mp-payment-1',
        }),
      }),
    );
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

  it('does not consume stock or award loyalty when another event already settled the order', async () => {
    prisma.payment.findFirst.mockResolvedValue(buildPaymentFixture());
    transaction.order.updateMany.mockResolvedValue({ count: 0 });

    await service.applyProviderPaymentStatus({
      id: 'mp-payment-1',
      status: 'approved',
      externalReference: 'order-1',
      paymentMethod: PaymentMethod.PIX,
      raw: { id: 'mp-payment-1', status: 'approved' },
    });

    expect(transaction.payment.updateMany).not.toHaveBeenCalled();
    expect(transaction.inventory.update).not.toHaveBeenCalled();
    expect(transaction.stockMovement.create).not.toHaveBeenCalled();
    expect(loyaltyService.awardPaidOrder).not.toHaveBeenCalled();
  });

  it('does not release stock twice when a cancellation event is repeated', async () => {
    prisma.payment.findFirst.mockResolvedValue(buildPaymentFixture());
    transaction.order.updateMany.mockResolvedValue({ count: 0 });

    await service.applyProviderPaymentStatus({
      id: 'mp-payment-1',
      status: 'rejected',
      externalReference: 'order-1',
      raw: { id: 'mp-payment-1', status: 'rejected' },
    });

    expect(transaction.payment.updateMany).not.toHaveBeenCalled();
    expect(transaction.inventory.update).not.toHaveBeenCalled();
    expect(transaction.stockMovement.create).not.toHaveBeenCalled();
  });

  it('records provider reversals without releasing already-consumed stock', async () => {
    const payment = buildPaymentFixture();
    payment.status = PaymentStatus.PAID;
    payment.providerReference = 'mp-payment-1';
    payment.order.status = OrderStatus.PAID;
    prisma.payment.findFirst.mockResolvedValue(payment);

    await service.applyProviderPaymentStatus({
      id: 'mp-payment-1',
      status: 'refunded',
      externalReference: 'order-1',
      raw: { id: 'mp-payment-1', status: 'refunded' },
    });

    expect(transaction.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'order-1',
        tenantId: 'tenant-1',
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
    expect(transaction.refund.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paymentId: 'payment-1',
          status: 'refunded',
        }),
      }),
    );
    expect(transaction.inventory.update).not.toHaveBeenCalled();
    expect(transaction.stockMovement.create).not.toHaveBeenCalled();
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

    expect(transaction.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'order-1',
        tenantId: 'tenant-1',
        status: OrderStatus.PENDING_PAYMENT,
      },
      data: { status: OrderStatus.CANCELLED, cancelledAt: expect.any(Date) },
    });
    expect(transaction.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          orderId: 'order-1',
          tenantId: 'tenant-1',
          status: { in: [PaymentStatus.PENDING, PaymentStatus.AUTHORIZED] },
        },
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
    providerReference: null as string | null,
    method: PaymentMethod.PIX,
    status: PaymentStatus.PENDING as PaymentStatus,
    amount: 100,
    order: {
      id: 'order-1',
      tenantId: 'tenant-1',
      status: OrderStatus.PENDING_PAYMENT as OrderStatus,
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
