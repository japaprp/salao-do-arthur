import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Appointment,
  AppointmentStatus,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from '@/types';
import { mockAppointments } from '@/lib/fixtures/appointments';

export const useAppointments = (filters?: {
  date?: string;
  professionalId?: string;
  clientId?: string;
  status?: AppointmentStatus;
}) => {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: async () => {
      return mockAppointments.filter((appointment: Appointment) => {
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
    mutationFn: async (data: CreateAppointmentDto) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        id: Date.now().toString(),
        tenantId: 'tenant-1',
        status: data.status ?? AppointmentStatus.SCHEDULED,
        price: data.price ?? 0,
        discount: data.discount ?? 0,
        totalAmount: (data.price ?? 0) - (data.discount ?? 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAppointmentDto }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};
