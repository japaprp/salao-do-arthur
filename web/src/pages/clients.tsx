import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PeopleIcon from '@mui/icons-material/People';
import SavingsIcon from '@mui/icons-material/Savings';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Chip, Container, Grid, Stack, Typography } from '@mui/material';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StatCard } from '@/components/dashboard/StatCard';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import { useClients } from '@/hooks/useClients';
import { formatCurrency } from '@/lib/formatters/appointments';
import { entityGridProps, metricGridProps } from '@/lib/ui/gridPresets';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const ClientsPage: NextPage = () => {
  const { data: clients = [], isLoading, error } = useClients();

  const loyaltyClients = clients.filter((client) => client.loyaltyPoints > 0).length;
  const portfolioValue = clients.reduce((sum, client) => sum + client.lifetimeValue, 0);
  const averageClientValue = clients.length ? portfolioValue / clients.length : 0;
  const errorMessage =
    error instanceof Error ? error.message : 'Não foi possível carregar os clientes.';

  return (
    <AuthGuard>
      <>
        <Head>
          <title>Clientes - Barbearia do Artur</title>
          <meta name="description" content="Gerenciar clientes da Barbearia do Artur" />
        </Head>

        <Layout title="Clientes">
          <Container maxWidth="xl">
            <Box mb={4}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                Clientes
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Base real de clientes conectada ao backend do salão.
              </Typography>
            </Box>

            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Total de clientes"
                  subtitle="Base cadastrada"
                  value={clients.length.toString()}
                  icon={<PeopleIcon color="secondary" />}
                  valueColor="secondary.main"
                  footnote="Carteira atual conectada ao backend."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Clientes com pontos"
                  subtitle="Relacionamento ativo"
                  value={loyaltyClients.toString()}
                  icon={<WorkspacePremiumIcon color="warning" />}
                  valueColor="warning.main"
                  footnote="Clientes já engajados em fidelização."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Lifetime value"
                  subtitle="Carteira acumulada"
                  value={formatCurrency(portfolioValue)}
                  icon={<SavingsIcon color="success" />}
                  valueColor="success.main"
                  footnote="Valor total já movimentado pela base."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Valor médio"
                  subtitle="Média por cliente"
                  value={formatCurrency(averageClientValue)}
                  icon={<TrendingUpIcon color="primary" />}
                  footnote="Ajuda a ler densidade comercial da carteira."
                />
              </Grid>
            </Grid>

            <Grid container spacing={2.5}>
              {isLoading ? (
                <Grid item xs={12}>
                  <Card>
                    <Typography variant="body1" color="text.secondary">
                      Carregando clientes...
                    </Typography>
                  </Card>
                </Grid>
              ) : error ? (
                <Grid item xs={12}>
                  <Card>
                    <Typography variant="body1" color="error">
                      Erro ao carregar clientes: {errorMessage}
                    </Typography>
                  </Card>
                </Grid>
              ) : clients.length > 0 ? (
                clients.map((client) => (
                  <Grid item {...entityGridProps} key={client.id}>
                    <Card
                      title={client.user?.name ?? 'Cliente sem nome'}
                      subtitle={client.user?.email ?? 'Email não informado'}
                      density="compact"
                      hover
                      sx={{ minHeight: { xs: 244, md: 258 } }}
                      action={
                        <Chip
                          icon={<FavoriteBorderIcon />}
                          label={client.loyaltyPoints > 0 ? 'Engajado' : 'Novo'}
                          size="small"
                          color={client.loyaltyPoints > 0 ? 'secondary' : 'default'}
                          variant={client.loyaltyPoints > 0 ? 'filled' : 'outlined'}
                        />
                      }
                    >
                      <Stack spacing={1.75} sx={{ height: '100%' }}>
                        <Box>
                          <Typography variant="h5" fontWeight={800} color="success.main">
                            {formatCurrency(client.lifetimeValue)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Lifetime value
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                          <Chip label={`${client.loyaltyPoints} pts`} size="small" variant="outlined" />
                          <Chip
                            label={
                              client.favoriteProfessional?.user?.name ?? 'Sem favorito definido'
                            }
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{
                              maxWidth: '100%',
                              '& .MuiChip-label': {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              },
                            }}
                          />
                        </Box>

                        <Stack spacing={0.65} sx={{ mt: 'auto' }}>
                          <Typography variant="body2" color="text.secondary">
                            {client.user?.phone ?? 'Telefone não informado'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Cadastro {dateFormatter.format(new Date(client.createdAt))}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Card>
                    <Typography variant="body1" color="text.secondary">
                      Nenhum cliente encontrado.
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

export default ClientsPage;
