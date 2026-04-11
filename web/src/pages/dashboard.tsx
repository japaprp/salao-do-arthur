import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { Box, Container, Grid, Typography } from '@mui/material';
import {
  Add as AddIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StatCard } from '@/components/dashboard/StatCard';
import { UpcomingAppointmentsPanel } from '@/components/dashboard/UpcomingAppointmentsPanel';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { useAppointments } from '@/hooks/useAppointments';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/formatters/appointments';
import { AppointmentStatus } from '@/types';

const DashboardPage: NextPage = () => {
  const { user } = useAuth();
  const { data: appointments, isLoading } = useAppointments();
  const appointmentList = appointments ?? [];
  const scheduledAppointments = appointmentList.filter(
    (appointment) => appointment.status !== AppointmentStatus.CANCELLED,
  );
  const projectedRevenue = scheduledAppointments.reduce(
    (total, appointment) => total + appointment.totalAmount,
    0,
  );
  const totalClients = new Set(appointmentList.map((appointment) => appointment.clientId)).size;
  const averageTicket = scheduledAppointments.length
    ? projectedRevenue / scheduledAppointments.length
    : 0;

  return (
    <AuthGuard>
      <>
        <Head>
          <title>Dashboard - Salão da Lu</title>
          <meta name="description" content="Dashboard administrativo do Salão da Lu" />
        </Head>

        <Layout title="Dashboard">
          <Container maxWidth="xl">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <div>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                  Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Bem-vindo, {user?.name}! Aqui está o panorama operacional mais próximo da API real.
                </Typography>
              </div>
              <Button variant="primary" startIcon={<AddIcon />}>
                Novo Agendamento
              </Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Agendamentos ativos"
                  subtitle="Carga operacional da agenda"
                  value={scheduledAppointments.length.toString()}
                  icon={<CalendarIcon color="primary" />}
                  footnote="Inclui agendados, check-in e atendimentos em andamento."
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Receita prevista"
                  subtitle="Base nos agendamentos em carteira"
                  value={formatCurrency(projectedRevenue)}
                  icon={<MoneyIcon color="success" />}
                  valueColor="success.main"
                  footnote="Sem depender de números estáticos artificiais."
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Clientes com agenda"
                  subtitle="Base ativa vinculada aos atendimentos"
                  value={totalClients.toString()}
                  icon={<PeopleIcon color="secondary" />}
                  valueColor="secondary.main"
                  footnote="Métrica derivada dos registros carregados."
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Ticket médio"
                  subtitle="Valor médio por atendimento"
                  value={formatCurrency(averageTicket)}
                  icon={<TrendingIcon color="warning" />}
                  valueColor="warning.main"
                  footnote="Pronto para ser recalculado com dados reais."
                />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <UpcomingAppointmentsPanel
                  appointments={appointmentList.slice(0, 4)}
                  isLoading={isLoading}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                        Ações rápidas
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Fluxos operacionais mais frequentes do salão.
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button variant="primary" fullWidth startIcon={<AddIcon />}>
                          Novo Agendamento
                        </Button>
                        <Button variant="secondary" fullWidth startIcon={<PeopleIcon />}>
                          Novo Cliente
                        </Button>
                        <Button variant="outlined" fullWidth startIcon={<CalendarIcon />}>
                          Ver Agenda Hoje
                        </Button>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                        Resumo de operação
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Agendamentos carregados</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {appointmentList.length}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Concluídos</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {
                              appointmentList.filter(
                                (appointment) => appointment.status === AppointmentStatus.COMPLETED,
                              ).length
                            }
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Receita prevista</Typography>
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            {formatCurrency(projectedRevenue)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Ticket médio</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(averageTicket)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Layout>
      </>
    </AuthGuard>
  );
};

export default DashboardPage;
