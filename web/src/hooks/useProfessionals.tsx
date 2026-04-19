import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Professional, ProfessionalServiceAssignment, SyncProfessionalServiceInput } from '@/types';
import { api } from '@/lib/api/client';
import {
  normalizeProfessional,
  normalizeProfessionalServiceAssignment,
} from '@/lib/api/normalizers';

export const useProfessionals = () =>
  useQuery<Professional[]>({
    queryKey: ['professionals'],
    queryFn: async () => {
      const response = await api.get<unknown[]>('/professionals');
      return Array.isArray(response)
        ? response.map((professional) => normalizeProfessional(professional))
        : [];
    },
  });

export const useProfessionalServiceLinks = (professionalId?: string) =>
  useQuery<ProfessionalServiceAssignment[]>({
    queryKey: ['professionals', professionalId, 'services'],
    enabled: Boolean(professionalId),
    queryFn: async () => {
      if (!professionalId) {
        return [];
      }

      const response = await api.get<unknown[]>(`/professionals/${professionalId}/services`);
      return Array.isArray(response)
        ? response.map((serviceLink) => normalizeProfessionalServiceAssignment(serviceLink))
        : [];
    },
  });

export const useSyncProfessionalServices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      professionalId,
      services,
    }: {
      professionalId: string;
      services: SyncProfessionalServiceInput[];
    }) => {
      const response = await api.put<unknown[]>(`/professionals/${professionalId}/services`, {
        services,
      });

      return Array.isArray(response)
        ? response.map((serviceLink) => normalizeProfessionalServiceAssignment(serviceLink))
        : [];
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      queryClient.invalidateQueries({
        queryKey: ['professionals', variables.professionalId, 'services'],
      });
    },
  });
};
