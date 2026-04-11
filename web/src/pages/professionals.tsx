import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { Container, Typography, Box, Grid, Chip } from '@mui/material';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Add as AddIcon, Person as PersonIcon } from '@mui/icons-material';
import { AuthGuard } from '@/components/auth/AuthGuard';

const ProfessionalsPage: NextPage = () => {
  // Mock data para desenvolvimento
  const professionals = [
    {
      id: '1',
      name: 'Ana Paula',
      email: 'ana@email.com',
      phone: '(11) 99999-9999',
      specialties: ['Corte', 'Escova', 'Coloração'],
      isActive: true,
      totalAppointments: 12,
      rating: 4.8,
    },
    {
      id: '2',
      name: 'Carlos Eduardo',
      email: 'carlos@email.com',
      phone: '(11) 88888-8888',
      specialties: ['Barba', 'Corte Masculino'],
      isActive: true,
      totalAppointments: 8,
      rating: 4.6,
    },
    {
      id: '3',
      name: 'Marina Costa',
      email: 'marina@email.com',
      phone: '(11) 77777-7777',
      specialties: ['Manicure', 'Pedicure', 'Design de Sobrancelhas'],
      isActive: false,
      totalAppointments: 0,
      rating: 0,
    },
  ];

  return (
    <AuthGuard>
      <>
      <Head>
        <title>Profissionais - Salão da Lu</title>
        <meta name="description" content="Gerenciar profissionais do Salão da Lu" />
      </Head>

      <Layout title="Profissionais">
        <Container maxWidth="xl">
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <div>
              <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                Profissionais
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Gerencie os profissionais do salão
              </Typography>
            </div>
            <Button variant="primary" startIcon={<AddIcon />}>
              Novo Profissional
            </Button>
          </Box>

          {/* Estatísticas */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                title="Total de Profissionais"
                subtitle="Profissionais cadastrados"
                hover
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon color="primary" />
                  <Typography variant="h3" color="primary.main" fontWeight={700}>
                    {professionals.length}
                  </Typography>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                title="Profissionais Ativos"
                subtitle="Disponíveis para agendamento"
                hover
              >
                <Typography variant="h3" color="success.main" fontWeight={700}>
                  {professionals.filter(p => p.isActive).length}
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Lista de Profissionais */}
          <Grid container spacing={3}>
            {professionals.map((professional) => (
              <Grid item xs={12} md={6} lg={4} key={professional.id}>
                <Card
                  title={professional.name}
                  subtitle={professional.email}
                  action={
                    <Button variant="outlined" size="small">
                      Ver Detalhes
                    </Button>
                  }
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    📞 {professional.phone}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                      Especialidades:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {professional.specialties.map((specialty, index) => (
                        <Chip
                          key={index}
                          label={specialty}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      📅 {professional.totalAppointments} agendamentos
                    </Typography>
                    <Chip
                      label={professional.isActive ? 'Ativo' : 'Inativo'}
                      color={professional.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  {professional.rating > 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      ⭐ {professional.rating} / 5.0
                    </Typography>
                  )}
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

export default ProfessionalsPage;
