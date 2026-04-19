import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { Alert, Box, Container, Grid, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import TrendingIcon from '@mui/icons-material/TrendingUp';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StatCard } from '@/components/dashboard/StatCard';
import { UpcomingAppointmentsPanel } from '@/components/dashboard/UpcomingAppointmentsPanel';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useReportsOverview } from '@/hooks/useReportsOverview';
import { formatCurrency } from '@/lib/formatters/appointments';
import {
  metricGridProps,
  sidePanelGridProps,
  widePanelGridProps,
} from '@/lib/ui/gridPresets';

const DashboardPage: NextPage = () => {
  const { user } = useAuth();
  const { data: reportsOverview, isLoading, error } = useReportsOverview();
  const summary = reportsOverview?.summary;
  const upcomingAppointments = reportsOverview?.upcomingAppointments ?? [];
  const errorMessage =
    error instanceof Error ? error.message : 'Não foi possível carregar o dashboard.';

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

            {error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            ) : null}

            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Agendamentos ativos"
                  subtitle="Carga operacional da agenda"
                  value={`${summary?.activeAppointments ?? 0}`}
                  icon={<CalendarIcon color="primary" />}
                  footnote="Inclui agendados, check-in e atendimentos em andamento."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Receita prevista"
                  subtitle="Base nos agendamentos em carteira"
                  value={formatCurrency(summary?.projectedRevenue ?? 0)}
                  icon={<MoneyIcon color="success" />}
                  valueColor="success.main"
                  footnote="Calculada pela API a partir dos agendamentos ativos."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Clientes totais"
                  subtitle="Base real do tenant"
                  value={`${summary?.totalClients ?? 0}`}
                  icon={<PeopleIcon color="secondary" />}
                  valueColor="secondary.main"
                  footnote={`+${summary?.newClients ?? 0} novos clientes no mês.`}
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Ticket médio"
                  subtitle="Concluídos no mês"
                  value={formatCurrency(summary?.averageTicket ?? 0)}
                  icon={<TrendingIcon color="warning" />}
                  valueColor="warning.main"
                  footnote={`${summary?.monthlyCompletedAppointments ?? 0} concluídos no mês atual.`}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2.5}>
              <Grid item {...widePanelGridProps}>
                <UpcomingAppointmentsPanel
                  appointments={upcomingAppointments}
                  isLoading={isLoading}
                />
              </Grid>

              <Grid item {...sidePanelGridProps}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6} lg={12}>
                    <Card
                      title="Ações rápidas"
                      subtitle="Fluxos operacionais frequentes"
                      density="compact"
                      sx={{ minHeight: { xs: 220, sm: 236, lg: 250 } }}
                    >
                      <Stack spacing={1}>
                        <Button variant="primary" fullWidth startIcon={<AddIcon />}>
                          Novo Agendamento
                        </Button>
                        <Button variant="secondary" fullWidth startIcon={<PeopleIcon />}>
                          Novo Cliente
                        </Button>
                        <Button variant="outlined" fullWidth startIcon={<CalendarIcon />}>
                          Ver Agenda Hoje
                        </Button>
                      </Stack>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} lg={12}>
                    <Card
                      title="Resumo de operação"
                      subtitle="Leitura rápida da carteira atual"
                      density="compact"
                      sx={{ minHeight: { xs: 220, sm: 236, lg: 250 } }}
                    >
                      <Stack spacing={1.15}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Agendamentos ativos</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {summary?.activeAppointments ?? 0}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Concluídos no mês</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {summary?.monthlyCompletedAppointments ?? 0}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Receita prevista</Typography>
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            {formatCurrency(summary?.projectedRevenue ?? 0)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Ticket médio</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(summary?.averageTicket ?? 0)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Card>
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
