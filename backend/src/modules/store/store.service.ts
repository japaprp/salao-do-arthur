import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  Product,
  StockMovementType,
} from '@prisma/client';
import { PrismaService, TenantPrismaClient } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ClientsService } from '../clients/clients.service';
import { MercadoPagoCheckoutProvider } from '../payments/mercado-pago.provider';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        product: {
          include: {
            images: true;
            inventory: true;
            category: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientsService: ClientsService,
    private readonly mercadoPagoProvider: MercadoPagoCheckoutProvider,
  ) {}

  async listProducts(tenantId: string) {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.product.findMany({
        where: { tenantId, active: true, deletedAt: null },
        include: { category: true, images: true, inventory: true },
        orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      }),
    );
  }

  async getCart(user: AuthenticatedUser): Promise<CartWithItems> {
    const client = await this.clientsService.findByUserIdAndTenant(user.userId, user.tenantId);
    return this.getOrCreateActiveCart(user.tenantId, user.userId, client.id);
  }

  async addCartItem(user: AuthenticatedUser, dto: AddCartItemDto): Promise<CartWithItems> {
    const client = await this.clientsService.findByUserIdAndTenant(user.userId, user.tenantId);

    return this.prisma.withTenant(user.tenantId, async transaction => {
      const cart = await this.getOrCreateActiveCartInTransaction(
        transaction,
        user.tenantId,
        user.userId,
        client.id,
      );
      const product = await this.findActiveProduct(transaction, user.tenantId, dto.productId);
      const existingItem = cart.items.find(item => item.productId === dto.productId);
      const nextQuantity = (existingItem?.quantity ?? 0) + dto.quantity;

      this.assertProductStock(product, nextQuantity);

      if (existingItem) {
        await transaction.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: nextQuantity,
            unitPrice: product.price,
            totalAmount: Number(product.price) * nextQuantity,
          },
        });
      } else {
        await transaction.cartItem.create({
          data: {
            tenantId: user.tenantId,
            cartId: cart.id,
            productId: product.id,
            quantity: dto.quantity,
            unitPrice: product.price,
            totalAmount: Number(product.price) * dto.quantity,
          },
        });
      }

      return this.findCartById(transaction, user.tenantId, cart.id);
    });
  }

  async updateCartItem(
    user: AuthenticatedUser,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartWithItems> {
    const client = await this.clientsService.findByUserIdAndTenant(user.userId, user.tenantId);

    return this.prisma.withTenant(user.tenantId, async transaction => {
      const cart = await this.getOrCreateActiveCartInTransaction(
        transaction,
        user.tenantId,
        user.userId,
        client.id,
      );
      const item = cart.items.find(cartItem => cartItem.id === itemId);
      if (!item) {
        throw new NotFoundException('Item do carrinho não encontrado.');
      }

      this.assertProductStock(item.product, dto.quantity);

      await transaction.cartItem.update({
        where: { id: itemId },
        data: {
          quantity: dto.quantity,
          totalAmount: Number(item.unitPrice) * dto.quantity,
        },
      });

      return this.findCartById(transaction, user.tenantId, cart.id);
    });
  }

  async removeCartItem(user: AuthenticatedUser, itemId: string): Promise<CartWithItems> {
    const client = await this.clientsService.findByUserIdAndTenant(user.userId, user.tenantId);

    return this.prisma.withTenant(user.tenantId, async transaction => {
      const cart = await this.getOrCreateActiveCartInTransaction(
        transaction,
        user.tenantId,
        user.userId,
        client.id,
      );
      const item = cart.items.find(cartItem => cartItem.id === itemId);
      if (!item) {
        throw new NotFoundException('Item do carrinho não encontrado.');
      }

      await transaction.cartItem.delete({ where: { id: itemId } });
      return this.findCartById(transaction, user.tenantId, cart.id);
    });
  }

  async checkout(user: AuthenticatedUser, dto: CheckoutDto) {
    const client = await this.clientsService.findByUserIdAndTenant(user.userId, user.tenantId);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const { order, payment, cartId } = await this.prisma.withTenant(user.tenantId, async transaction => {
      const cart = await this.getOrCreateActiveCartInTransaction(
        transaction,
        user.tenantId,
        user.userId,
        client.id,
      );
      if (cart.items.length === 0) {
        throw new BadRequestException('Carrinho vazio.');
      }

      for (const item of cart.items) {
        this.assertProductStock(item.product, item.quantity);
      }

      const subtotalAmount = cart.items.reduce(
        (sum, item) => sum + Number(item.totalAmount),
        0,
      );
      const shippingAmount = dto.deliveryMethod === DeliveryMethod.DELIVERY ? 0 : 0;
      const totalAmount = subtotalAmount + shippingAmount;

      const order = await transaction.order.create({
        data: {
          tenantId: user.tenantId,
          userId: user.userId,
          clientId: client.id,
          number: this.generateOrderNumber(),
          status: OrderStatus.PENDING_PAYMENT,
          subtotalAmount,
          shippingAmount,
          totalAmount,
          deliveryMethod: dto.deliveryMethod ?? DeliveryMethod.PICKUP,
          notes: dto.notes,
          placedAt: new Date(),
          items: {
            create: cart.items.map(item => ({
              tenantId: user.tenantId,
              productId: item.productId,
              productName: item.product.name,
              sku: item.product.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountAmount: item.discountAmount,
              totalAmount: item.totalAmount,
            })),
          },
          payments: {
            create: {
              tenantId: user.tenantId,
              provider: 'mercado_pago',
              method: dto.paymentMethod ?? PaymentMethod.PIX,
              status: PaymentStatus.PENDING,
              amount: totalAmount,
              expiresAt,
            },
          },
        },
        include: { items: true, payments: true },
      });

      for (const item of cart.items) {
        if (!item.product.trackInventory || !item.product.inventory) {
          continue;
        }

        const previousQty = item.product.inventory.availableQty;
        const newQty = previousQty - item.quantity;
        const previousReservedQty = item.product.inventory.reservedQty;
        await transaction.inventory.update({
          where: { productId: item.productId },
          data: {
            availableQty: newQty,
            reservedQty: previousReservedQty + item.quantity,
          },
        });
        await transaction.stockMovement.create({
          data: {
            tenantId: user.tenantId,
            inventoryId: item.product.inventory.id,
            productId: item.productId,
            orderId: order.id,
            createdByUserId: user.userId,
            type: StockMovementType.RESERVE,
            quantity: item.quantity,
            previousQty,
            newQty,
            reason: `Reserva do pedido ${order.number}`,
          },
        });
      }

      return { order, payment: order.payments[0], cartId: cart.id };
    });

    try {
      const preference = await this.mercadoPagoProvider.createPreference({
        orderId: order.id,
        orderNumber: order.number,
        payerEmail: user.email,
        expiresAt,
        items: order.items.map(item => ({
          id: item.productId ?? item.id,
          title: item.productName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
      });

      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          metadata: {
            preferenceId: preference.preferenceId,
            checkoutUrl: preference.checkoutUrl,
          },
        },
      });

      await this.prisma.cart.update({
        where: { id: cartId },
        data: { active: false, checkedOutAt: new Date() },
      });

      return {
        order,
        payment: updatedPayment,
        checkout: {
          preferenceId: preference.preferenceId,
          checkoutUrl: preference.checkoutUrl,
          expiresAt: expiresAt.toISOString(),
        },
      };
    } catch (error) {
      await this.releaseCheckoutReservation(order.id, user.tenantId);
      throw error;
    }
  }

  async listOrders(user: AuthenticatedUser) {
    const client = await this.clientsService.findByUserIdAndTenant(user.userId, user.tenantId);
    return this.prisma.withTenant(user.tenantId, transaction =>
      transaction.order.findMany({
        where: {
          tenantId: user.tenantId,
          clientId: client.id,
          deletedAt: null,
        },
        include: { items: true, payments: true },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async listTenantOrders(tenantId: string) {
    return this.prisma.withTenant(tenantId, transaction =>
      transaction.order.findMany({
        where: {
          tenantId,
          deletedAt: null,
        },
        include: {
          items: true,
          payments: true,
          client: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    );
  }

  async addFavorite(user: AuthenticatedUser, productId: string) {
    const client = await this.clientsService.findByUserIdAndTenant(user.userId, user.tenantId);

    return this.prisma.withTenant(user.tenantId, async transaction => {
      await this.findActiveProduct(transaction, user.tenantId, productId);

      return transaction.productFavorite.upsert({
        where: {
          tenantId_clientId_productId: {
            tenantId: user.tenantId,
            clientId: client.id,
            productId,
          },
        },
        create: {
          tenantId: user.tenantId,
          clientId: client.id,
          productId,
        },
        update: { deletedAt: null },
        include: { product: { include: { images: true, inventory: true, category: true } } },
      });
    });
  }

  async removeFavorite(user: AuthenticatedUser, productId: string) {
    const client = await this.clientsService.findByUserIdAndTenant(user.userId, user.tenantId);

    await this.prisma.productFavorite.updateMany({
      where: {
        tenantId: user.tenantId,
        clientId: client.id,
        productId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    return { removed: true };
  }

  async listFavorites(user: AuthenticatedUser) {
    const client = await this.clientsService.findByUserIdAndTenant(user.userId, user.tenantId);
    return this.prisma.withTenant(user.tenantId, transaction =>
      transaction.productFavorite.findMany({
        where: {
          tenantId: user.tenantId,
          clientId: client.id,
          deletedAt: null,
        },
        include: { product: { include: { images: true, inventory: true, category: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  private async releaseCheckoutReservation(orderId: string, tenantId: string): Promise<void> {
    await this.prisma.withTenant(tenantId, async transaction => {
      const order = await transaction.order.findFirst({
        where: { id: orderId, tenantId },
        include: {
          payments: true,
          items: {
            include: {
              product: { include: { inventory: true } },
            },
          },
        },
      });

      if (!order) {
        return;
      }

      await transaction.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
      });
      await transaction.payment.updateMany({
        where: { orderId: order.id, tenantId },
        data: {
          status: PaymentStatus.CANCELLED,
          failureReason: 'Falha ao criar preferência Mercado Pago.',
        },
      });

      for (const item of order.items) {
        if (!item.product?.trackInventory || !item.product.inventory) {
          continue;
        }

        const previousAvailableQty = item.product.inventory.availableQty;
        const newAvailableQty = previousAvailableQty + item.quantity;
        const previousReservedQty = item.product.inventory.reservedQty;
        const newReservedQty = Math.max(0, previousReservedQty - item.quantity);

        await transaction.inventory.update({
          where: { productId: item.productId ?? '' },
          data: {
            availableQty: newAvailableQty,
            reservedQty: newReservedQty,
          },
        });
        await transaction.stockMovement.create({
          data: {
            tenantId,
            inventoryId: item.product.inventory.id,
            productId: item.productId ?? item.product.id,
            orderId: order.id,
            type: StockMovementType.RELEASE,
            quantity: item.quantity,
            previousQty: previousAvailableQty,
            newQty: newAvailableQty,
            reason: 'Falha ao criar preferência Mercado Pago.',
          },
        });
      }
    });
  }

  private async getOrCreateActiveCart(
    tenantId: string,
    userId: string,
    clientId: string,
  ): Promise<CartWithItems> {
    return this.prisma.withTenant(tenantId, transaction =>
      this.getOrCreateActiveCartInTransaction(transaction, tenantId, userId, clientId),
    );
  }

  private async getOrCreateActiveCartInTransaction(
    transaction: TenantPrismaClient,
    tenantId: string,
    userId: string,
    clientId: string,
  ): Promise<CartWithItems> {
    const cart = await transaction.cart.findFirst({
      where: {
        tenantId,
        userId,
        clientId,
        active: true,
        checkedOutAt: null,
        deletedAt: null,
      },
      include: {
        items: {
          include: {
            product: { include: { images: true, inventory: true, category: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (cart) {
      return cart;
    }

    return transaction.cart.create({
      data: { tenantId, userId, clientId },
      include: {
        items: {
          include: {
            product: { include: { images: true, inventory: true, category: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  private async findCartById(
    transaction: TenantPrismaClient,
    tenantId: string,
    cartId: string,
  ): Promise<CartWithItems> {
    return transaction.cart.findFirstOrThrow({
      where: { id: cartId, tenantId },
      include: {
        items: {
          include: {
            product: { include: { images: true, inventory: true, category: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  private async findActiveProduct(
    transaction: TenantPrismaClient,
    tenantId: string,
    productId: string,
  ): Promise<Product & { inventory: { availableQty: number } | null }> {
    const product = await transaction.product.findFirst({
      where: { id: productId, tenantId, active: true, deletedAt: null },
      include: { inventory: true },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return product;
  }

  private assertProductStock(
    product: Product & { inventory: { availableQty: number } | null },
    quantity: number,
  ) {
    if (!product.trackInventory) {
      return;
    }

    const availableQty = product.inventory?.availableQty ?? 0;
    if (availableQty < quantity) {
      throw new BadRequestException(`Estoque insuficiente para ${product.name}.`);
    }
  }

  private generateOrderNumber(): string {
    const now = new Date();
    const timestamp = [
      now.getFullYear(),
      `${now.getMonth() + 1}`.padStart(2, '0'),
      `${now.getDate()}`.padStart(2, '0'),
      `${now.getHours()}`.padStart(2, '0'),
      `${now.getMinutes()}`.padStart(2, '0'),
      `${now.getSeconds()}`.padStart(2, '0'),
    ].join('');
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `LOJA-${timestamp}-${suffix}`;
  }
}
