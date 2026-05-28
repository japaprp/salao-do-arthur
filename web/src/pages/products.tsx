import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import InventoryIcon from '@mui/icons-material/Inventory2';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import WarningIcon from '@mui/icons-material/WarningAmber';
import { Box, Chip, Container, Grid, Stack, Typography } from '@mui/material';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StatCard } from '@/components/dashboard/StatCard';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/formatters/appointments';
import { entityGridProps, metricGridProps } from '@/lib/ui/gridPresets';

const ProductsPage: NextPage = () => {
  const { data: products = [], isLoading, error } = useProducts();
  const activeProducts = products.filter((product) => product.active);
  const stockTotal = products.reduce(
    (sum, product) => sum + (product.inventory?.availableQty ?? 0),
    0,
  );
  const lowStock = products.filter((product) => {
    const inventory = product.inventory;
    return inventory != null && inventory.availableQty <= inventory.reorderPoint;
  }).length;
  const shelfValue = products.reduce(
    (sum, product) => sum + product.price * (product.inventory?.availableQty ?? 0),
    0,
  );
  const errorMessage =
    error instanceof Error ? error.message : 'Não foi possível carregar a lojinha.';

  return (
    <AuthGuard>
      <>
        <Head>
          <title>Lojinha - Barbearia do Artur</title>
          <meta name="description" content="Produtos da lojinha da Barbearia do Artur" />
        </Head>

        <Layout title="Lojinha">
          <Container maxWidth="xl">
            <Box mb={4}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                Lojinha
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Produtos para vender no balcão junto do corte, da barba e dos pacotes.
              </Typography>
            </Box>

            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Produtos ativos"
                  subtitle="Prontos para venda"
                  value={activeProducts.length.toString()}
                  icon={<ShoppingBagIcon color="primary" />}
                  footnote="Itens visíveis para a operação."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Unidades em estoque"
                  subtitle="Disponíveis agora"
                  value={stockTotal.toString()}
                  icon={<InventoryIcon color="success" />}
                  valueColor="success.main"
                  footnote="Soma dos produtos com controle de estoque."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Estoque baixo"
                  subtitle="Precisa repor"
                  value={lowStock.toString()}
                  icon={<WarningIcon color="warning" />}
                  valueColor="warning.main"
                  footnote="Itens abaixo ou no ponto de reposição."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Valor em prateleira"
                  subtitle="Preço de venda"
                  value={formatCurrency(shelfValue)}
                  icon={<ShoppingBagIcon color="secondary" />}
                  valueColor="secondary.main"
                  footnote="Ajuda o Artur a enxergar dinheiro parado."
                />
              </Grid>
            </Grid>

            <Grid container spacing={2.5}>
              {isLoading ? (
                <Grid item xs={12}>
                  <Card>
                    <Typography variant="body1" color="text.secondary">
                      Carregando produtos...
                    </Typography>
                  </Card>
                </Grid>
              ) : error ? (
                <Grid item xs={12}>
                  <Card>
                    <Typography variant="body1" color="error">
                      Erro ao carregar produtos: {errorMessage}
                    </Typography>
                  </Card>
                </Grid>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <Grid item {...entityGridProps} key={product.id}>
                    <Card
                      title={product.name}
                      subtitle={product.shortDescription ?? product.description ?? 'Produto da lojinha'}
                      density="compact"
                      hover
                      sx={{ minHeight: { xs: 244, md: 258 } }}
                      action={
                        <Chip
                          label={product.featured ? 'Destaque' : product.active ? 'Ativo' : 'Inativo'}
                          color={product.featured ? 'warning' : product.active ? 'success' : 'default'}
                          size="small"
                        />
                      }
                    >
                      <Stack spacing={1.75} sx={{ height: '100%' }}>
                        <Box>
                          <Typography variant="h5" fontWeight={800} color="success.main">
                            {formatCurrency(product.price)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.sku ?? 'SKU não informado'}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                          <Chip
                            icon={<InventoryIcon />}
                            label={`${product.inventory?.availableQty ?? 0} un.`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`Reposição ${product.inventory?.reorderPoint ?? 0}`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 'auto',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {product.description ?? 'Sem descrição detalhada.'}
                        </Typography>
                      </Stack>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Card>
                    <Typography variant="body1" color="text.secondary">
                      Nenhum produto encontrado.
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

export default ProductsPage;
