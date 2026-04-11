import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Appointment } from '@/types';
import {
  formatAppointmentDateTime,
  formatAppointmentStatusLabel,
  formatCurrency,
  getAppointmentClientName,
  getAppointmentProfessionalName,
} from '@/lib/formatters/appointments';

interface UpcomingAppointmentsPanelProps {
  appointments: Appointment[];
  isLoading: boolean;
}

export const UpcomingAppointmentsPanel: React.FC<UpcomingAppointmentsPanelProps> = ({
  appointments,
  isLoading,
}) => {
  return (
    <Card
      title="Próximos agendamentos"
      action={
        <Button variant="outlined" size="small">
          Ver agenda completa
        </Button>
      }
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Agenda operacional já alinhada ao contrato do backend.
      </Typography>

      {isLoading ? (
        <Typography variant="body2" color="text.secondary">
          Carregando agendamentos...
        </Typography>
      ) : appointments.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nenhum agendamento encontrado.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {appointments.map((appointment) => (
            <Box
              key={appointment.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 2,
                alignItems: 'center',
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {getAppointmentClientName(appointment)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {appointment.service?.name} • {getAppointmentProfessionalName(appointment)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatAppointmentDateTime(appointment.scheduledAt)} • {formatCurrency(appointment.totalAmount)}
                </Typography>
              </Box>
              <Chip
                label={formatAppointmentStatusLabel(appointment.status)}
                color={appointment.status === 'COMPLETED' ? 'success' : 'primary'}
                variant={appointment.status === 'COMPLETED' ? 'filled' : 'outlined'}
              />
            </Box>
          ))}
        </Box>
      )}
    </Card>
  );
};
