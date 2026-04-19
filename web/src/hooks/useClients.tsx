import { useQuery } from '@tanstack/react-query';
import { Client } from '@/types';
import { api } from '@/lib/api/client';
import { normalizeClient } from '@/lib/api/normalizers';

export const useClients = () =>
  useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get<unknown[]>('/clients');
      return Array.isArray(response) ? response.map((client) => normalizeClient(client)) : [];
    },
  });
