import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { Box, Chip, Container, Grid, Typography } from '@mui/material';
import { Add as AddIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';
import { AuthGuard } from '@/components/auth/AuthGuard';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAppointments } from '@/hooks/useAppointments';
import {
  formatAppointmentDate,
  formatAppointmentStatusLabel,
  formatAppointmentTime,
  formatCurrency,
  getAppointmentClientName,
  getAppointmentProfessionalName,
} from '@/lib/formatters/appointments';

const AppointmentsPage: NextPage = () => {
  const { data: appointments, isLoading, error } = useAppointments();

  return (
    <AuthGuard>
      <>
        <Head>
          <title>Agendamentos - Salão da Lu</title>
          <meta name="description" content="Gerenciar agendamentos do Salão da Lu" />
        </Head>

        <Layout title="Agendamentos">
          <Container maxWidth="xl">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <div>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                  Agendamentos
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Agenda operacional alinhada ao modelo real do backend.
                </Typography>
              </div>
              <Button variant="primary" startIcon={<AddIcon />}>
                Novo Agendamento
              </Button>
            </Box>

            <Card sx={{ mb: 4 }}>
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                <Button variant="outlined" startIcon={<CalendarIcon />}>
                  Hoje
                </Button>
                <Button variant="outlined">Próximos 7 dias</Button>
                <Button variant="outlined">Todos os status</Button>
              </Box>
            </Card>

            <Grid container spacing={3}>
              {isLoading ? (
                <Grid item xs={12}>
                  <Card>
                    <Typography variant="body1" color="text.secondary">
                      Carregando agendamentos...
                    </Typography>
                  </Card>
                </Grid>
              ) : error ? (
                <Grid item xs={12}>
                  <Card>
                    <Typography variant="body1" color="error">
                      Erro ao carregar agendamentos: {error.message}
                    </Typography>
                  </Card>
                </Grid>
              ) : appointments && appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <Grid item xs={12} md={6} lg={4} key={appointment.id}>
                    <Card
                      title={getAppointmentClientName(appointment)}
                      subtitle={`${formatAppointmentDate(appointment.scheduledAt)} • ${formatAppointmentTime(appointment.scheduledAt)}`}
                      action={
                        <Chip
                          label={formatAppointmentStatusLabel(appointment.status)}
                          color={appointment.status === 'COMPLETED' ? 'success' : 'primary'}
                          variant={appointment.status === 'COMPLETED' ? 'filled' : 'outlined'}
                          size="small"
                        />
                      }
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Serviço: {appointment.service?.name ?? 'Serviço não informado'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Profissional: {getAppointmentProfessionalName(appointment)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Valor: {formatCurrency(appointment.totalAmount)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {appointment.notes || 'Sem observações operacionais.'}
                      </Typography>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Card>
                    <Typography variant="body1" color="text.secondary">
                      Nenhum agendamento encontrado.
                    </Typography>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Container>
        </Layout>
      </>
    </AuthGuard>
  );
};

export default AppointmentsPage;
