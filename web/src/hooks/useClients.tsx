import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export const useRedeemClientLoyalty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, points, reason }: { clientId: string; points: number; reason: string }) =>
      api.post(`/loyalty/clients/${clientId}/redeem`, { points, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useAdjustClientLoyalty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      points,
      amount,
      reason,
    }: {
      clientId: string;
      points: number;
      amount?: number;
      reason: string;
    }) =>
      api.post(`/loyalty/clients/${clientId}/adjust`, {
        points,
        ...(amount != null ? { amount } : {}),
        reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};
