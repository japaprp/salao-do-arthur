import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { Container, Typography, Box, Grid } from '@mui/material';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import { AuthGuard } from '@/components/auth/AuthGuard';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

const ReportsPage: NextPage = () => {
  // Mock data para desenvolvimento
  const stats = {
    totalRevenue: 8450.00,
    monthlyRevenue: 3200.00,
    totalAppointments: 89,
    monthlyAppointments: 34,
    totalClients: 156,
    newClients: 12,
    averageTicket: 95.00,
    topService: 'Corte + Escova',
  };

  const monthlyData = [
    { month: 'Jan', revenue: 3200, appointments: 34 },
    { month: 'Fev', revenue: 2800, appointments: 28 },
    { month: 'Mar', revenue: 2450, appointments: 27 },
  ];

  return (
    <AuthGuard>
      <>
      <Head>
        <title>Relatórios - Salão da Lu</title>
        <meta name="description" content="Relatórios e análises do Salão da Lu" />
      </Head>

      <Layout title="Relatórios">
        <Container maxWidth="xl">
          {/* Header */}
          <Box mb={4}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
              Relatórios e Análises
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Acompanhe o desempenho do seu salão com métricas detalhadas
            </Typography>
          </Box>

          {/* Cards de Métricas Principais */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                title="Receita Total"
                subtitle="Acumulado do ano"
                hover
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <MoneyIcon color="success" />
                  <Typography variant="h4" color="success.main" fontWeight={700}>
                    R$ {stats.totalRevenue.toFixed(2)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="success.main" fontWeight={500}>
                  +15% em relação ao ano passado
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                title="Agendamentos"
                subtitle="Total realizado"
                hover
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarIcon color="primary" />
                  <Typography variant="h4" color="primary.main" fontWeight={700}>
                    {stats.totalAppointments}
                  </Typography>
                </Box>
                <Typography variant="body2" color="success.main" fontWeight={500}>
                  +8% em relação ao mês passado
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                title="Ticket Médio"
                subtitle="Por agendamento"
                hover
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingIcon color="secondary" />
                  <Typography variant="h4" color="secondary.main" fontWeight={700}>
                    R$ {stats.averageTicket.toFixed(2)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Média dos últimos 30 dias
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                title="Novos Clientes"
                subtitle="Este mês"
                hover
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <PeopleIcon color="warning" />
                  <Typography variant="h4" color="warning.main" fontWeight={700}>
                    {stats.newClients}
                  </Typography>
                </Box>
                <Typography variant="body2" color="success.main" fontWeight={500}>
                  +25% em relação ao mês passado
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Relatórios Detalhados */}
          <Grid container spacing={3}>
            {/* Receita Mensal */}
            <Grid item xs={12} md={8}>
              <Card title="Receita Mensal">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Evolução da receita nos últimos meses
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {monthlyData.map((data) => (
                    <Box
                      key={data.month}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        minWidth: 120,
                      }}
                    >
                      <Typography variant="h6" fontWeight={600}>
                        {data.month}
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        R$ {data.revenue.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {data.appointments} agendamentos
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>

            {/* Top Serviços */}
            <Grid item xs={12} md={4}>
              <Card title="Serviços Mais Procurados">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Ranking dos serviços mais realizados
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { name: 'Corte + Escova', count: 25, percentage: 28 },
                    { name: 'Barba Completa', count: 18, percentage: 20 },
                    { name: 'Manicure', count: 15, percentage: 17 },
                    { name: 'Coloração', count: 8, percentage: 9 },
                  ].map((service, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {service.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {service.count} agendamentos
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="primary.main" fontWeight={600}>
                        {service.percentage}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>

            {/* Performance por Profissional */}
            <Grid item xs={12}>
              <Card title="Performance por Profissional">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Estatísticas de cada profissional do salão
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { name: 'Ana Paula', appointments: 32, revenue: 1850.00, rating: 4.8 },
                    { name: 'Carlos Eduardo', appointments: 28, revenue: 1420.00, rating: 4.6 },
                    { name: 'Marina Costa', appointments: 15, revenue: 890.00, rating: 4.9 },
                  ].map((professional, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {professional.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ⭐ {professional.rating}/5.0 • {professional.appointments} agendamentos
                        </Typography>
                      </Box>
                      <Typography variant="h6" color="success.main" fontWeight={600}>
                        R$ {professional.revenue.toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Layout>
    </>
    </AuthGuard>
  );
};

export default ReportsPage;
