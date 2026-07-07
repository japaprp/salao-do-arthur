import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { Box, Button, Chip, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LogoutIcon from '@mui/icons-material/Logout';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useMyAppointments } from '@/hooks/useAppointments';
import { useAuth } from '@/hooks/useAuth';
import { useMyStoreOrders, useStorefrontProducts } from '@/hooks/useProducts';
import {
  formatAppointmentDate,
  formatAppointmentStatusLabel,
  formatAppointmentTime,
  formatCurrency,
} from '@/lib/formatters/appointments';

const ClientHome: NextPage = () => {
  const { logout, user } = useAuth();
  const { data: appointments = [], isLoading: isLoadingAppointments } = useMyAppointments();
  const { data: products = [], isLoading: isLoadingProducts } = useStorefrontProducts();
  const { data: orders = [], isLoading: isLoadingOrders } = useMyStoreOrders();

  return (
    <AuthGuard>
      <Head>
        <title>Cliente - Barbearia do Artur</title>
      </Head>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          gap={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          flexDirection={{ xs: 'column', sm: 'row' }}
          mb={4}
        >
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
            <ShortcutCard
              icon={<EventAvailableIcon color="primary" />}
              title="Agendamentos"
              description={`${appointments.length} horario${appointments.length === 1 ? '' : 's'} na sua conta`}
              targetId="client-appointments"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ShortcutCard
              icon={<ShoppingBagIcon color="primary" />}
              title="Lojinha"
              description={`${products.length} produto${products.length === 1 ? '' : 's'} disponivel${products.length === 1 ? '' : 's'}`}
              targetId="client-store"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ShortcutCard
              icon={<WorkspacePremiumIcon color="primary" />}
              title="Perfil"
              description="Dados da conta e relacionamento com a barbearia"
              targetId="client-profile"
            />
          </Grid>
        </Grid>

        <Stack spacing={3} sx={{ mt: 4 }}>
          <Paper id="client-appointments" sx={{ p: 3, scrollMarginTop: 24 }}>
            <SectionHeader
              icon={<EventAvailableIcon color="primary" />}
              title="Meus agendamentos"
              subtitle="Horarios vinculados ao seu cadastro"
            />
            {isLoadingAppointments ? (
              <Typography color="text.secondary">Carregando agendamentos...</Typography>
            ) : appointments.length === 0 ? (
              <Typography color="text.secondary">Nenhum horario agendado nesta conta.</Typography>
            ) : (
              <Stack spacing={1.5}>
                {appointments.slice(0, 5).map((appointment) => (
                  <Box
                    key={appointment.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 2,
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      flexDirection: { xs: 'column', sm: 'row' },
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      pb: 1.5,
                    }}
                  >
                    <Box>
                      <Typography fontWeight={700}>
                        {appointment.service?.name ?? 'Atendimento'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatAppointmentDate(appointment.scheduledAt)} as{' '}
                        {formatAppointmentTime(appointment.scheduledAt)}
                      </Typography>
                    </Box>
                    <Chip label={formatAppointmentStatusLabel(appointment.status)} size="small" />
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>

          <Paper id="client-store" sx={{ p: 3, scrollMarginTop: 24 }}>
            <SectionHeader
              icon={<ShoppingBagIcon color="primary" />}
              title="Lojinha"
              subtitle="Produtos disponiveis para retirada ou compra vinculada ao atendimento"
            />
            {isLoadingProducts ? (
              <Typography color="text.secondary">Carregando produtos...</Typography>
            ) : products.length === 0 ? (
              <Typography color="text.secondary">Nenhum produto ativo no momento.</Typography>
            ) : (
              <Grid container spacing={2}>
                {products.slice(0, 6).map((product) => (
                  <Grid item xs={12} sm={6} md={4} key={product.id}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Stack spacing={1}>
                        <Typography fontWeight={700}>{product.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.shortDescription ?? product.description ?? 'Produto da lojinha'}
                        </Typography>
                        <Typography variant="h6" color="success.main" fontWeight={800}>
                          {formatCurrency(product.price)}
                        </Typography>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${product.inventory?.availableQty ?? 0} em estoque`}
                        />
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Meus pedidos
              </Typography>
              {isLoadingOrders ? (
                <Typography color="text.secondary">Carregando pedidos...</Typography>
              ) : orders.length === 0 ? (
                <Typography color="text.secondary">Nenhum pedido criado ainda.</Typography>
              ) : (
                <Stack spacing={1}>
                  {orders.slice(0, 4).map((order) => (
                    <Box
                      key={order.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 2,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography>{order.number}</Typography>
                      <Typography fontWeight={700}>{formatCurrency(order.totalAmount)}</Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>

          <Paper id="client-profile" sx={{ p: 3, scrollMarginTop: 24 }}>
            <SectionHeader
              icon={<WorkspacePremiumIcon color="primary" />}
              title="Perfil"
              subtitle="Informacoes da sua conta"
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Nome
                </Typography>
                <Typography fontWeight={700}>{user?.name ?? 'Cliente'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography fontWeight={700}>{user?.email ?? 'Nao informado'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      </Container>
    </AuthGuard>
  );
};

function ShortcutCard({
  icon,
  title,
  description,
  targetId,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  targetId: string;
}) {
  const activate = () => scrollToSection(targetId);

  return (
    <Paper
      role="button"
      tabIndex={0}
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      }}
      sx={{
        p: 3,
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
        },
      }}
    >
      {icon}
      <Typography variant="h6" mt={2}>
        {title}
      </Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Paper>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Box display="flex" gap={1.5} alignItems="center" mb={2.5}>
      {icon}
      <Box>
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default ClientHome;
