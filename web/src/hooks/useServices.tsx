import { useQuery } from '@tanstack/react-query';
import { Service } from '@/types';
import { api } from '@/lib/api/client';
import { normalizeService } from '@/lib/api/normalizers';

export const useServices = () =>
  useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await api.get<unknown[]>('/services');
      return Array.isArray(response) ? response.map((service) => normalizeService(service)) : [];
    },
  });
