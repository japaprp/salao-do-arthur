import { useQuery } from '@tanstack/react-query';
import { Product } from '@/types';
import { api } from '@/lib/api/client';
import { normalizeProduct } from '@/lib/api/normalizers';

export const useProducts = () =>
  useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get<unknown[]>('/products');
      return Array.isArray(response) ? response.map((product) => normalizeProduct(product)) : [];
    },
  });
