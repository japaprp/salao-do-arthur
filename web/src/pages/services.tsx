import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { Container, Typography, Box, Grid } from '@mui/material';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Add as AddIcon, Business as BusinessIcon, AccessTime as TimeIcon } from '@mui/icons-material';
import { AuthGuard } from '@/components/auth/AuthGuard';

const ServicesPage: NextPage = () => {
  // Mock data para desenvolvimento
  const services = [
    {
      id: '1',
      name: 'Corte + Escova',
      description: 'Corte de cabelo completo com escova profissional',
      duration: 60,
      price: 50.00,
      category: 'Cabelo',
      isActive: true,
      totalAppointments: 25,
    },
    {
      id: '2',
      name: 'Barba Completa',
      description: 'Corte e modelagem de barba com toalha quente',
      duration: 30,
      price: 25.00,
      category: 'Barba',
      isActive: true,
      totalAppointments: 18,
    },
    {
      id: '3',
      name: 'Coloração',
      description: 'Coloração profissional com produtos de qualidade',
      duration: 120,
      price: 120.00,
      category: 'Cabelo',
      isActive: true,
      totalAppointments: 8,
    },
    {
      id: '4',
      name: 'Manicure + Pedicure',
      description: 'Cuidados completos para mãos e pés',
      duration: 90,
      price: 40.00,
      category: 'Unhas',
      isActive: false,
      totalAppointments: 0,
    },
  ];

  const categories = [...new Set(services.map(s => s.category))];

  return (
    <AuthGuard>
      <>
      <Head>
        <title>Serviços - Salão da Lu</title>
        <meta name="description" content="Gerenciar serviços do Salão da Lu" />
      </Head>

      <Layout title="Serviços">
        <Container maxWidth="xl">
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <div>
              <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                Serviços
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Gerencie os serviços oferecidos pelo salão
              </Typography>
            </div>
            <Button variant="primary" startIcon={<AddIcon />}>
              Novo Serviço
            </Button>
          </Box>

          {/* Estatísticas */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                title="Total de Serviços"
                subtitle="Serviços cadastrados"
                hover
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <BusinessIcon color="primary" />
                  <Typography variant="h3" color="primary.main" fontWeight={700}>
                    {services.length}
                  </Typography>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                title="Serviços Ativos"
                subtitle="Disponíveis para agendamento"
                hover
              >
                <Typography variant="h3" color="success.main" fontWeight={700}>
                  {services.filter(s => s.isActive).length}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                title="Receita Estimada"
                subtitle="Baseado nos preços atuais"
                hover
              >
                <Typography variant="h3" color="secondary.main" fontWeight={700}>
                  R$ {services.filter(s => s.isActive).reduce((sum, s) => sum + s.price, 0).toFixed(2)}
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Filtros por Categoria */}
          <Card sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Filtrar por Categoria
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button variant="outlined" size="small">
                Todos
              </Button>
              {categories.map((category) => (
                <Button key={category} variant="outlined" size="small">
                  {category}
                </Button>
              ))}
            </Box>
          </Card>

          {/* Lista de Serviços */}
          <Grid container spacing={3}>
            {services.map((service) => (
              <Grid item xs={12} md={6} lg={4} key={service.id}>
                <Card
                  title={service.name}
                  subtitle={`R$ ${service.price.toFixed(2)}`}
                  action={
                    <Button variant="outlined" size="small">
                      Editar
                    </Button>
                  }
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {service.description}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {service.duration} min
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      📁 {service.category}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      📅 {service.totalAppointments} agendamentos
                    </Typography>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: service.isActive ? 'success.main' : 'grey.400',
                      }}
                      title={service.isActive ? 'Ativo' : 'Inativo'}
                    />
                  </Box>
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

export default ServicesPage;
