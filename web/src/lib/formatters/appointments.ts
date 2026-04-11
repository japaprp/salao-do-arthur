import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment, AppointmentStatus } from '@/types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatAppointmentDate(value: string): string {
  return format(new Date(value), "dd 'de' MMM", { locale: ptBR });
}

export function formatAppointmentDateTime(value: string): string {
  return format(new Date(value), "dd/MM 'às' HH:mm", { locale: ptBR });
}

export function formatAppointmentTime(value: string): string {
  return format(new Date(value), 'HH:mm', { locale: ptBR });
}

export function formatAppointmentStatusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    [AppointmentStatus.SCHEDULED]: 'Agendado',
    [AppointmentStatus.CHECKED_IN]: 'Check-in',
    [AppointmentStatus.IN_PROGRESS]: 'Em atendimento',
    [AppointmentStatus.COMPLETED]: 'Concluído',
    [AppointmentStatus.CANCELLED]: 'Cancelado',
  };

  return labels[status];
}

export function getAppointmentClientName(appointment: Appointment): string {
  return appointment.client?.user?.name ?? 'Cliente sem nome';
}

export function getAppointmentProfessionalName(appointment: Appointment): string {
  return appointment.professional?.user?.name ?? 'Profissional não definido';
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}
