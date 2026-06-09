/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException } from '@nestjs/common';
import { DeliveryMethod, PaymentMethod, StockMovementType } from '@prisma/client';
import { StoreService } from './store.service';

describe('StoreService', () => {
  const transaction = {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    cart: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findFirstOrThrow: jest.fn(),
    },
    cartItem: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    inventory: {
      update: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
    productFavorite: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const prisma = {
    withTenant: jest.fn((_tenantId: string, operation: (client: typeof transaction) => unknown) =>
      operation(transaction),
    ),
    payment: {
      update: jest.fn(),
    },
    cart: {
      update: jest.fn(),
    },
    productFavorite: {
      updateMany: jest.fn(),
    },
  };

  const clientsService = {
    findByUserIdAndTenant: jest.fn(),
  };

  const mercadoPagoProvider = {
    createPreference: jest.fn(),
  };

  const user = {
    userId: 'user-1',
    email: 'cliente@barbearia.test',
    role: 'CLIENT',
    tenantId: 'tenant-1',
  };

  let service: StoreService;

  beforeEach(() => {
    jest.clearAllMocks();
    clientsService.findByUserIdAndTenant.mockResolvedValue({
      id: 'client-1',
      userId: 'user-1',
    });
    prisma.payment.update.mockResolvedValue({ id: 'payment-1' });
    prisma.cart.update.mockResolvedValue({ id: 'cart-1' });
    mercadoPagoProvider.createPreference.mockResolvedValue({
      preferenceId: 'preference-1',
      checkoutUrl: 'https://www.mercadopago.com.br/checkout/v1/redirect',
    });
    service = new StoreService(
      prisma as never,
      clientsService as never,
      mercadoPagoProvider as never,
    );
  });

  it('rejects checkout when the cart is empty', async () => {
    transaction.cart.findFirst.mockResolvedValue({
      id: 'cart-1',
      items: [],
    });

    await expect(service.checkout(user as never, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates an order, reserves stock and creates Mercado Pago preference during checkout', async () => {
    transaction.cart.findFirst.mockResolvedValue({
      id: 'cart-1',
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          quantity: 2,
          unitPrice: 50,
          discountAmount: 0,
          totalAmount: 100,
          product: {
            id: 'product-1',
            name: 'Pomada modeladora',
            sku: 'POM-001',
            price: 50,
            trackInventory: true,
            inventory: {
              id: 'inventory-1',
              availableQty: 10,
              reservedQty: 0,
            },
          },
        },
      ],
    });
    transaction.order.create.mockResolvedValue({
      id: 'order-1',
      number: 'LOJA-TESTE',
      items: [],
      payments: [{ id: 'payment-1' }],
    });

    const result = await service.checkout(user as never, {
      deliveryMethod: DeliveryMethod.PICKUP,
      paymentMethod: PaymentMethod.PIX,
    });

    expect(transaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'user-1',
          clientId: 'client-1',
          subtotalAmount: 100,
          totalAmount: 100,
          payments: expect.objectContaining({
            create: expect.objectContaining({
              method: PaymentMethod.PIX,
              amount: 100,
              provider: 'mercado_pago',
            }),
          }),
        }),
      }),
    );
    expect(transaction.inventory.update).toHaveBeenCalledWith({
      where: { productId: 'product-1' },
      data: { availableQty: 8, reservedQty: 2 },
    });
    expect(transaction.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: StockMovementType.RESERVE,
          quantity: 2,
          previousQty: 10,
          newQty: 8,
        }),
      }),
    );
    expect(mercadoPagoProvider.createPreference).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        orderNumber: 'LOJA-TESTE',
      }),
    );
    expect(prisma.cart.update).toHaveBeenCalledWith({
      where: { id: 'cart-1' },
      data: { active: false, checkedOutAt: expect.any(Date) },
    });
    expect(result).toEqual(
      expect.objectContaining({
        order: expect.objectContaining({ id: 'order-1' }),
        checkout: expect.objectContaining({ preferenceId: 'preference-1' }),
      }),
    );
  });
});
