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
      subtitle="Agenda operacional sincronizada com o contrato atual"
      density="compact"
      action={
        <Button variant="outlined" size="small">
          Ver agenda completa
        </Button>
      }
    >
      {isLoading ? (
        <Typography variant="body2" color="text.secondary">
          Carregando agendamentos...
        </Typography>
      ) : appointments.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nenhum agendamento encontrado.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {appointments.map((appointment) => (
            <Box
              key={appointment.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
                alignItems: 'flex-start',
                p: 1.75,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2.5,
              }}
            >
              <Box sx={{ minWidth: 0, flex: '1 1 180px' }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {getAppointmentClientName(appointment)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {appointment.service?.name} • {getAppointmentProfessionalName(appointment)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatAppointmentDateTime(appointment.scheduledAt)} •{' '}
                  {formatCurrency(appointment.totalAmount)}
                </Typography>
              </Box>
              <Chip
                label={formatAppointmentStatusLabel(appointment.status)}
                color={appointment.status === 'COMPLETED' ? 'success' : 'primary'}
                variant={appointment.status === 'COMPLETED' ? 'filled' : 'outlined'}
                size="small"
              />
            </Box>
          ))}
        </Box>
      )}
    </Card>
  );
};
