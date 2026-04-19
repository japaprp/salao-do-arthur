import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import TrendingIcon from '@mui/icons-material/TrendingUp';
import {
  alpha,
  Alert,
  Box,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StatCard } from '@/components/dashboard/StatCard';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import { useReportsOverview } from '@/hooks/useReportsOverview';
import { formatCurrency } from '@/lib/formatters/appointments';
import {
  entityGridProps,
  metricGridProps,
  sidePanelGridProps,
  widePanelGridProps,
} from '@/lib/ui/gridPresets';

const ReportsPage: NextPage = () => {
  const { data: reportsOverview, isLoading, error } = useReportsOverview();
  const summary = reportsOverview?.summary;
  const monthlyData = reportsOverview?.monthlyData ?? [];
  const topServices = reportsOverview?.topServices ?? [];
  const professionalPerformance = reportsOverview?.professionalPerformance ?? [];
  const topService = reportsOverview?.topService;
  const errorMessage =
    error instanceof Error ? error.message : 'Não foi possível carregar os relatórios.';

  return (
    <AuthGuard>
      <>
        <Head>
          <title>Relatórios - Salão da Lu</title>
          <meta name="description" content="Relatórios reais do Salão da Lu" />
        </Head>

        <Layout title="Relatórios">
          <Container maxWidth="xl">
            <Box mb={4}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                Relatórios
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Visão gerencial baseada exclusivamente nas métricas consolidadas do backend.
              </Typography>
            </Box>

            {error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            ) : null}

            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Receita total"
                  subtitle="Atendimentos concluídos"
                  value={formatCurrency(summary?.totalRevenue ?? 0)}
                  icon={<MoneyIcon color="success" />}
                  valueColor="success.main"
                  footnote="Receita consolidada do histórico concluído."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Concluídos"
                  subtitle="Volume histórico"
                  value={`${summary?.totalCompletedAppointments ?? 0}`}
                  icon={<CalendarIcon color="primary" />}
                  footnote={`${summary?.monthlyCompletedAppointments ?? 0} concluídos no mês.`}
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Ticket médio"
                  subtitle="Concluídos no mês"
                  value={formatCurrency(summary?.averageTicket ?? 0)}
                  icon={<TrendingIcon color="secondary" />}
                  valueColor="secondary.main"
                  footnote="Receita do mês dividida pelos concluídos do mês."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Novos clientes"
                  subtitle="Entradas do mês"
                  value={`${summary?.newClients ?? 0}`}
                  icon={<PeopleIcon color="warning" />}
                  valueColor="warning.main"
                  footnote={`Base total atual: ${summary?.totalClients ?? 0} clientes.`}
                />
              </Grid>
            </Grid>

            {isLoading ? (
              <Card>
                <Loading size="large" text="Carregando métricas reais..." />
              </Card>
            ) : (
              <Grid container spacing={2.5}>
                <Grid item {...widePanelGridProps}>
                  <Card
                    title="Receita por mês"
                    subtitle="Últimos 4 meses de atendimentos concluídos"
                    density="compact"
                  >
                    <Grid container spacing={2}>
                      {monthlyData.length > 0 ? (
                        monthlyData.map((dataPoint) => (
                          <Grid item xs={6} md={3} key={dataPoint.monthKey}>
                            <Box
                              sx={{
                                p: 2,
                                height: '100%',
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.default',
                              }}
                            >
                              <Typography variant="overline" color="text.secondary">
                                {dataPoint.label}
                              </Typography>
                              <Typography variant="h6" fontWeight={800}>
                                {formatCurrency(dataPoint.revenue)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {dataPoint.appointments} concluídos
                              </Typography>
                            </Box>
                          </Grid>
                        ))
                      ) : (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Ainda não há concluídos suficientes para a série mensal.
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Card>
                </Grid>

                <Grid item {...sidePanelGridProps}>
                  <Card
                    title="Serviço líder"
                    subtitle="Últimos 90 dias"
                    density="compact"
                    sx={{ minHeight: { xs: 220, lg: 246 } }}
                  >
                    {topService ? (
                      <Stack spacing={1.6} sx={{ height: '100%' }}>
                        <Box>
                          <Typography variant="h5" fontWeight={800} color="primary.main">
                            {topService.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {topService.count} atendimentos e {formatCurrency(topService.revenue)} de receita.
                          </Typography>
                        </Box>

                        <Stack spacing={1}>
                          {topServices.map((service) => (
                            <Box
                              key={service.serviceId}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 1,
                                p: 1.25,
                                borderRadius: 2.5,
                                bgcolor: alpha('#172033', 0.04),
                              }}
                            >
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {service.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {service.count} atendimentos
                                </Typography>
                              </Box>
                              <Chip
                                size="small"
                                label={`${service.percentage}%`}
                                color="primary"
                              />
                            </Box>
                          ))}
                        </Stack>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sem concluídos recentes para ranquear serviços.
                      </Typography>
                    )}
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card
                    title="Performance por profissional"
                    subtitle="Receita gerada nos últimos 90 dias"
                    density="compact"
                  >
                    <Grid container spacing={2}>
                      {professionalPerformance.length > 0 ? (
                        professionalPerformance.map((professional) => (
                          <Grid item {...entityGridProps} key={professional.professionalId}>
                            <Box
                              sx={{
                                p: 2,
                                height: '100%',
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.default',
                              }}
                            >
                              <Stack spacing={1.1}>
                                <Typography variant="subtitle1" fontWeight={700}>
                                  {professional.name}
                                </Typography>
                                <Typography variant="h6" fontWeight={800} color="success.main">
                                  {formatCurrency(professional.revenue)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {professional.appointments} atendimentos concluídos
                                </Typography>
                              </Stack>
                            </Box>
                          </Grid>
                        ))
                      ) : (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Ainda não há concluídos recentes para medir a equipe.
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card
                    title="Leitura executiva"
                    subtitle="Resumo comercial do ciclo atual"
                    density="compact"
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: alpha('#1F7A8C', 0.08),
                            height: '100%',
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                            Receita do mês
                          </Typography>
                          <Typography variant="h6" fontWeight={800}>
                            {formatCurrency(summary?.monthlyRevenue ?? 0)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: alpha('#E09F3E', 0.12),
                            height: '100%',
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                            Crescimento de base
                          </Typography>
                          <Typography variant="h6" fontWeight={800}>
                            {summary?.newClients ?? 0} novos clientes
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: alpha('#A63D40', 0.08),
                            height: '100%',
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                            Carteira ativa
                          </Typography>
                          <Typography variant="h6" fontWeight={800}>
                            {summary?.activeAppointments ?? 0} agendamentos ativos
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Container>
        </Layout>
      </>
    </AuthGuard>
  );
};

export default ReportsPage;
