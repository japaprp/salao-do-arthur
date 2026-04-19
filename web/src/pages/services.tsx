import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import LayersIcon from '@mui/icons-material/Layers';
import TuneIcon from '@mui/icons-material/Tune';
import { Box, Chip, Container, Grid, Stack, Typography } from '@mui/material';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StatCard } from '@/components/dashboard/StatCard';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import { useServices } from '@/hooks/useServices';
import { formatCurrency } from '@/lib/formatters/appointments';
import { entityGridProps, metricGridProps } from '@/lib/ui/gridPresets';

const ServicesPage: NextPage = () => {
  const { data: services = [], isLoading, error } = useServices();

  const activeServices = services.filter((service) => service.active).length;
  const averagePrice = services.length
    ? services.reduce((sum, service) => sum + service.price, 0) / services.length
    : 0;
  const averageDuration = services.length
    ? services.reduce((sum, service) => sum + service.durationMinutes, 0) / services.length
    : 0;
  const errorMessage =
    error instanceof Error ? error.message : 'Não foi possível carregar os serviços.';

  return (
    <AuthGuard>
      <>
        <Head>
          <title>Serviços - Salão da Lu</title>
          <meta name="description" content="Gerenciar serviços do Salão da Lu" />
        </Head>

        <Layout title="Serviços">
          <Container maxWidth="xl">
            <Box mb={4}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                Serviços
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Catálogo operacional conectado ao backend do salão.
              </Typography>
            </Box>

            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Total de serviços"
                  subtitle="Catálogo cadastrado"
                  value={services.length.toString()}
                  icon={<BusinessCenterIcon color="primary" />}
                  footnote="Quantidade total disponível na operação."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Serviços ativos"
                  subtitle="Disponíveis para agenda"
                  value={activeServices.toString()}
                  icon={<LayersIcon color="success" />}
                  valueColor="success.main"
                  footnote="Serviços que podem entrar na agenda agora."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Preço médio"
                  subtitle="Base do catálogo"
                  value={formatCurrency(averagePrice)}
                  icon={<AttachMoneyIcon color="warning" />}
                  valueColor="warning.main"
                  footnote="Leitura rápida de precificação atual."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Duração média"
                  subtitle="Tempo por serviço"
                  value={`${averageDuration.toFixed(0)} min`}
                  icon={<AccessTimeIcon color="secondary" />}
                  valueColor="secondary.main"
                  footnote="Ajuda a compactar agenda e operação."
                />
              </Grid>
            </Grid>

            <Grid container spacing={2.5}>
              {isLoading ? (
                <Grid item xs={12}>
                  <Card>
                    <Typography variant="body1" color="text.secondary">
                      Carregando serviços...
                    </Typography>
                  </Card>
                </Grid>
              ) : error ? (
                <Grid item xs={12}>
                  <Card>
                    <Typography variant="body1" color="error">
                      Erro ao carregar serviços: {errorMessage}
                    </Typography>
                  </Card>
                </Grid>
              ) : services.length > 0 ? (
                services.map((service) => (
                  <Grid item {...entityGridProps} key={service.id}>
                    <Card
                      title={service.name}
                      subtitle={service.description ?? 'Sem descrição operacional'}
                      density="compact"
                      hover
                      sx={{ minHeight: { xs: 244, md: 258 } }}
                      action={
                        <Chip
                          label={service.active ? 'Ativo' : 'Inativo'}
                          color={service.active ? 'success' : 'default'}
                          size="small"
                        />
                      }
                    >
                      <Stack spacing={1.75} sx={{ height: '100%' }}>
                        <Box>
                          <Typography variant="h5" fontWeight={800} color="warning.main">
                            {formatCurrency(service.price)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Valor padrão
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                          <Chip
                            icon={<AccessTimeIcon />}
                            label={`${service.durationMinutes} min`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            icon={<TuneIcon />}
                            label={`${service.bufferBeforeMinutes}/${service.bufferAfterMinutes} min`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>

                        <Stack spacing={0.65} sx={{ mt: 'auto' }}>
                          <Typography variant="body2" color="text.secondary">
                            {service.parallelAllowed ? 'Permite execução paralela' : 'Fluxo exclusivo'}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {service.description ?? 'Descrição resumida ainda não cadastrada.'}
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
                      Nenhum serviço encontrado.
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

export default ServicesPage;
