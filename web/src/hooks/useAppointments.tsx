import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Appointment,
  AppointmentStatus,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from '@/types';
import { api } from '@/lib/api/client';
import { normalizeAppointment } from '@/lib/api/normalizers';

type AppointmentsResponse =
  | unknown[]
  | {
      data?: unknown[];
      total?: number;
      offset?: number;
      limit?: number;
      hasMore?: boolean;
    };

export const useAppointments = (filters?: {
  date?: string;
  professionalId?: string;
  clientId?: string;
  status?: AppointmentStatus;
}) => {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: async () => {
      const response = await api.get<AppointmentsResponse>('/appointments');
      const rawAppointments = Array.isArray(response)
        ? response
        : Array.isArray(response.data)
          ? response.data
          : [];

      const appointments = rawAppointments.map((appointment) =>
        normalizeAppointment(appointment),
      );

      return appointments.filter((appointment: Appointment) => {
        if (filters?.status && appointment.status !== filters.status) {
          return false;
        }

        if (filters?.professionalId && appointment.professionalId !== filters.professionalId) {
          return false;
        }

        if (filters?.clientId && appointment.clientId !== filters.clientId) {
          return false;
        }

        if (filters?.date && !appointment.scheduledAt.startsWith(filters.date)) {
          return false;
        }

        return true;
      });
    },
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAppointmentDto) =>
      normalizeAppointment(await api.post('/appointments', data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAppointmentDto }) =>
      normalizeAppointment(await api.put(`/appointments/${id}`, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => normalizeAppointment(await api.delete(`/appointments/${id}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useConfirmAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) =>
      normalizeAppointment(await api.post(`/appointments/${id}/confirm`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['reports-overview'] });
    },
  });
};

export const useMessageAppointmentClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) =>
      api.post<{ message: string }>(`/appointments/${id}/message-client`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useOfferEarlierSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, proposedAt }: { id: string; proposedAt: string }) =>
      api.post<{ message: string }>(`/appointments/${id}/offer-earlier-slot`, {
        proposedAt,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useCancelAppointmentWithPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) =>
      api.post<{ feeApplies: boolean; cancellationFee: number }>(
        `/appointments/${id}/cancel-with-policy`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['reports-overview'] });
    },
  });
};
