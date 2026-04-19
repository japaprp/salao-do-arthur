import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { Box, Chip, Container, Grid, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StatCard } from '@/components/dashboard/StatCard';
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
import { entityGridProps, metricGridProps } from '@/lib/ui/gridPresets';
import { AppointmentStatus } from '@/types';

const AppointmentsPage: NextPage = () => {
  const { data: appointments, isLoading, error } = useAppointments();
  const appointmentList = appointments ?? [];
  const activeAppointments = appointmentList.filter(
    (appointment) => appointment.status !== AppointmentStatus.CANCELLED,
  );
  const projectedRevenue = activeAppointments.reduce(
    (total, appointment) => total + appointment.totalAmount,
    0,
  );
  const scheduledClients = new Set(appointmentList.map((appointment) => appointment.clientId)).size;
  const averageTicket = activeAppointments.length
    ? projectedRevenue / activeAppointments.length
    : 0;
  const errorMessage =
    error instanceof Error ? error.message : 'Não foi possível carregar os agendamentos.';

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

            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Agendamentos"
                  subtitle="Carga da agenda"
                  value={appointmentList.length.toString()}
                  icon={<CalendarIcon color="primary" />}
                  footnote="Todos os registros carregados na visão atual."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Carteira ativa"
                  subtitle="Sem cancelados"
                  value={activeAppointments.length.toString()}
                  icon={<TrendingUpIcon color="secondary" />}
                  valueColor="secondary.main"
                  footnote="Atendimentos que seguem válidos na operação."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Receita prevista"
                  subtitle="Base atual da agenda"
                  value={formatCurrency(projectedRevenue)}
                  icon={<MoneyIcon color="success" />}
                  valueColor="success.main"
                  footnote="Soma dos atendimentos ainda ativos."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Clientes na agenda"
                  subtitle="Base vinculada"
                  value={scheduledClients.toString()}
                  icon={<PeopleIcon color="warning" />}
                  valueColor="warning.main"
                  footnote={`Ticket médio ${formatCurrency(averageTicket)}`}
                />
              </Grid>
            </Grid>

            <Card density="compact" sx={{ mb: 4 }}>
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                <Button variant="outlined" startIcon={<CalendarIcon />}>
                  Hoje
                </Button>
                <Button variant="outlined">Próximos 7 dias</Button>
                <Button variant="outlined">Todos os status</Button>
              </Box>
            </Card>

            <Grid container spacing={2.5}>
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
                      Erro ao carregar agendamentos: {errorMessage}
                    </Typography>
                  </Card>
                </Grid>
              ) : appointmentList.length > 0 ? (
                appointmentList.map((appointment) => (
                  <Grid item {...entityGridProps} key={appointment.id}>
                    <Card
                      title={getAppointmentClientName(appointment)}
                      subtitle={`${formatAppointmentDate(appointment.scheduledAt)} • ${formatAppointmentTime(appointment.scheduledAt)}`}
                      density="compact"
                      hover
                      sx={{ minHeight: { xs: 244, md: 260 } }}
                      action={
                        <Chip
                          label={formatAppointmentStatusLabel(appointment.status)}
                          color={appointment.status === 'COMPLETED' ? 'success' : 'primary'}
                          variant={appointment.status === 'COMPLETED' ? 'filled' : 'outlined'}
                          size="small"
                        />
                      }
                    >
                      <Stack spacing={1.75} sx={{ height: '100%' }}>
                        <Box>
                          <Typography variant="h5" fontWeight={800} color="success.main">
                            {formatCurrency(appointment.totalAmount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Valor do atendimento
                          </Typography>
                        </Box>

                        <Stack spacing={0.65}>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.service?.name ?? 'Serviço não informado'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getAppointmentProfessionalName(appointment)}
                          </Typography>
                        </Stack>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 'auto',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {appointment.notes || 'Sem observações operacionais.'}
                        </Typography>
                      </Stack>
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
