import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Appointment,
  AppointmentStatus,
  CreateAppointmentDto,
  CreateTimeOffDto,
  TimeOff,
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
    mutationFn: async ({
      id,
      proposedAt,
      message,
    }: {
      id: string;
      proposedAt: string;
      message?: string;
    }) =>
      api.post<{ message: string }>(`/appointments/${id}/offer-earlier-slot`, {
        proposedAt,
        message,
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

function useAppointmentAction(endpoint: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) =>
      normalizeAppointment(await api.post(`/appointments/${id}/${endpoint}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['reports-overview'] });
    },
  });
}

export const useCheckinAppointment = () => useAppointmentAction('checkin');

export const useStartAppointment = () => useAppointmentAction('start');

export const useCompleteAppointment = () => useAppointmentAction('complete');

function normalizeTimeOff(raw: unknown): TimeOff {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const professional =
    value.professional && typeof value.professional === 'object'
      ? (value.professional as TimeOff['professional'])
      : null;

  return {
    id: String(value.id ?? ''),
    tenantId: String(value.tenantId ?? ''),
    professionalId: value.professionalId == null ? null : String(value.professionalId),
    title: String(value.title ?? 'Bloqueio de agenda'),
    reason: value.reason == null ? null : String(value.reason),
    startAt: String(value.startAt ?? ''),
    endAt: String(value.endAt ?? ''),
    createdAt: String(value.createdAt ?? ''),
    updatedAt: String(value.updatedAt ?? ''),
    professional,
  };
}

export const useTimeOffs = () =>
  useQuery<TimeOff[]>({
    queryKey: ['appointments', 'time-offs'],
    queryFn: async () => {
      const response = await api.get<unknown[]>('/appointments/time-offs');
      return Array.isArray(response) ? response.map((item) => normalizeTimeOff(item)) : [];
    },
  });

export const useCreateTimeOff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTimeOffDto) =>
      normalizeTimeOff(await api.post('/appointments/time-offs', data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'time-offs'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useDeleteTimeOff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => normalizeTimeOff(await api.delete(`/appointments/time-offs/${id}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'time-offs'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};
