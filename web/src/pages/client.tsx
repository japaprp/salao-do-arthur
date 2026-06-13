import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { Box, Button, Container, Grid, Paper, Typography } from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LogoutIcon from '@mui/icons-material/Logout';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/useAuth';

const ClientHome: NextPage = () => {
  const { logout, user } = useAuth();

  return (
    <AuthGuard>
      <Head>
        <title>Cliente - Barbearia do Artur</title>
      </Head>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" gap={2} alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Barbearia do Artur
            </Typography>
            <Typography color="text.secondary">
              Ola, {user?.name ?? 'cliente'}. Este e seu acesso de cliente.
            </Typography>
          </Box>
          <Button startIcon={<LogoutIcon />} variant="outlined" onClick={logout}>
            Sair
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <EventAvailableIcon color="primary" />
              <Typography variant="h6" mt={2}>
                Agendamentos
              </Typography>
              <Typography color="text.secondary">
                Consulte seus horarios e acompanhe confirmacoes da barbearia.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <ShoppingBagIcon color="primary" />
              <Typography variant="h6" mt={2}>
                Lojinha
              </Typography>
              <Typography color="text.secondary">
                Veja produtos, pedidos e pagamentos vinculados a sua conta.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <WorkspacePremiumIcon color="primary" />
              <Typography variant="h6" mt={2}>
                Fidelidade
              </Typography>
              <Typography color="text.secondary">
                Acompanhe pontos, beneficios e recompensas disponiveis.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </AuthGuard>
  );
};

export default ClientHome;
