import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Product, StoreOrder } from '@/types';
import { api } from '@/lib/api/client';
import { normalizeProduct } from '@/lib/api/normalizers';

export interface ProductInventoryPayload {
  availableQty: number;
  reorderPoint: number;
  safetyStock: number;
}

export interface ProductPayload {
  name: string;
  sku?: string;
  shortDescription?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  featured: boolean;
  active: boolean;
  shippable: boolean;
  trackInventory: boolean;
  inventory?: ProductInventoryPayload;
}

export const useProducts = () =>
  useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get<unknown[]>('/products');
      return Array.isArray(response) ? response.map((product) => normalizeProduct(product)) : [];
    },
  });

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProductPayload) =>
      normalizeProduct(await api.post('/products', payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['store-products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ProductPayload }) =>
      normalizeProduct(await api.put(`/products/${id}`, payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['store-products'] });
      queryClient.invalidateQueries({ queryKey: ['store-orders'] });
    },
  });
};

export const useDeactivateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => normalizeProduct(await api.delete(`/products/${id}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['store-products'] });
    },
  });
};

export const useStorefrontProducts = () =>
  useQuery<Product[]>({
    queryKey: ['store-products'],
    queryFn: async () => {
      const response = await api.get<unknown[]>('/store/products');
      return Array.isArray(response) ? response.map((product) => normalizeProduct(product)) : [];
    },
  });

export const useMyStoreOrders = () =>
  useQuery<StoreOrder[]>({
    queryKey: ['my-store-orders'],
    queryFn: async () => {
      const response = await api.get<unknown[]>('/store/orders');
      return Array.isArray(response) ? response.map(normalizeStoreOrder) : [];
    },
  });

export const useStoreOrders = () =>
  useQuery<StoreOrder[]>({
    queryKey: ['store-orders'],
    queryFn: async () => {
      const response = await api.get<unknown[]>('/store/admin/orders');
      return Array.isArray(response) ? response.map(normalizeStoreOrder) : [];
    },
  });

export const useRefundPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentId,
      amount,
      reason,
      restockItems,
    }: {
      paymentId: string;
      amount?: number;
      reason: string;
      restockItems: boolean;
    }) =>
      api.post(`/payments/${paymentId}/refunds`, {
        ...(amount != null ? { amount } : {}),
        reason,
        restockItems,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

function normalizeStoreOrder(raw: unknown): StoreOrder {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const items = Array.isArray(value.items) ? value.items : [];
  const payments = Array.isArray(value.payments) ? value.payments : [];

  return {
    id: String(value.id ?? ''),
    number: String(value.number ?? ''),
    status: String(value.status ?? 'PENDING_PAYMENT'),
    totalAmount: toNumber(value.totalAmount),
    subtotalAmount: toNumber(value.subtotalAmount),
    deliveryMethod: String(value.deliveryMethod ?? 'PICKUP'),
    placedAt: value.placedAt == null ? null : String(value.placedAt),
    createdAt: String(value.createdAt ?? ''),
    client:
      value.client && typeof value.client === 'object'
        ? (value.client as StoreOrder['client'])
        : null,
    items: items.map((item) => {
      const orderItem = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      return {
        id: String(orderItem.id ?? ''),
        productName: String(orderItem.productName ?? 'Produto'),
        sku: orderItem.sku == null ? null : String(orderItem.sku),
        quantity: toNumber(orderItem.quantity),
        unitPrice: toNumber(orderItem.unitPrice),
        totalAmount: toNumber(orderItem.totalAmount),
      };
    }),
    payments: payments.map((payment) => {
      const orderPayment = (payment && typeof payment === 'object' ? payment : {}) as Record<string, unknown>;
      return {
        id: String(orderPayment.id ?? ''),
        provider: String(orderPayment.provider ?? ''),
        method: String(orderPayment.method ?? ''),
        status: String(orderPayment.status ?? ''),
        amount: toNumber(orderPayment.amount),
      };
    }),
  };
}

function toNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0);
}
