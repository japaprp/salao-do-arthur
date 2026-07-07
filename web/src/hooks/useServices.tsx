import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Service } from '@/types';
import { api } from '@/lib/api/client';
import { normalizeService } from '@/lib/api/normalizers';

export interface ServicePayload {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  parallelAllowed: boolean;
  active: boolean;
}

export const useServices = () =>
  useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await api.get<unknown[]>('/services');
      return Array.isArray(response) ? response.map((service) => normalizeService(service)) : [];
    },
  });

export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ServicePayload) =>
      normalizeService(await api.post('/services', payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ServicePayload }) =>
      normalizeService(await api.put(`/services/${id}`, payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['reports-overview'] });
    },
  });
};

export const useDeactivateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => normalizeService(await api.delete(`/services/${id}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['reports-overview'] });
    },
  });
};
