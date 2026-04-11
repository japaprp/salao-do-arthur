import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { Container, Typography, Box, Grid } from '@mui/material';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Add as AddIcon, People as PeopleIcon } from '@mui/icons-material';
import { AuthGuard } from '@/components/auth/AuthGuard';

const ClientsPage: NextPage = () => {
  // Mock data para desenvolvimento
  const clients = [
    {
      id: '1',
      name: 'Maria Silva',
      email: 'maria@email.com',
      phone: '(11) 99999-9999',
      totalAppointments: 5,
      lastAppointment: '2024-01-15',
    },
    {
      id: '2',
      name: 'João Santos',
      email: 'joao@email.com',
      phone: '(11) 88888-8888',
      totalAppointments: 3,
      lastAppointment: '2024-01-10',
    },
    {
      id: '3',
      name: 'Carla Oliveira',
      email: 'carla@email.com',
      phone: '(11) 77777-7777',
      totalAppointments: 8,
      lastAppointment: '2024-01-20',
    },
  ];

  return (
    <AuthGuard>
      <>
      <Head>
        <title>Clientes - Salão da Lu</title>
        <meta name="description" content="Gerenciar clientes do Salão da Lu" />
      </Head>

      <Layout title="Clientes">
        <Container maxWidth="xl">
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <div>
              <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                Clientes
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Gerencie a base de clientes do salão
              </Typography>
            </div>
            <Button variant="primary" startIcon={<AddIcon />}>
              Novo Cliente
            </Button>
          </Box>

          {/* Estatísticas */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                title="Total de Clientes"
                subtitle="Clientes cadastrados"
                hover
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <PeopleIcon color="secondary" />
                  <Typography variant="h3" color="secondary.main" fontWeight={700}>
                    {clients.length}
                  </Typography>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                title="Clientes Ativos"
                subtitle="Com agendamentos recentes"
                hover
              >
                <Typography variant="h3" color="success.main" fontWeight={700}>
                  {clients.filter(c => c.totalAppointments > 0).length}
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Lista de Clientes */}
          <Grid container spacing={3}>
            {clients.map((client) => (
              <Grid item xs={12} md={6} lg={4} key={client.id}>
                <Card
                  title={client.name}
                  subtitle={client.email}
                  action={
                    <Button variant="outlined" size="small">
                      Ver Detalhes
                    </Button>
                  }
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    📞 {client.phone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    📅 {client.totalAppointments} agendamentos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    🕒 Último: {client.lastAppointment}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Layout>
    </>
    </AuthGuard>
  );
};

export default ClientsPage;
