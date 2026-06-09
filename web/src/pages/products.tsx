import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import InventoryIcon from '@mui/icons-material/Inventory2';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import WarningIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StatCard } from '@/components/dashboard/StatCard';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import { useProducts, useRefundPayment, useStoreOrders } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/formatters/appointments';
import { entityGridProps, metricGridProps } from '@/lib/ui/gridPresets';

const ProductsPage: NextPage = () => {
  const [refundPaymentId, setRefundPaymentId] = React.useState<string | null>(null);
  const [refundAmount, setRefundAmount] = React.useState('');
  const [refundReason, setRefundReason] = React.useState('');
  const [restockItems, setRestockItems] = React.useState(false);
  const { data: products = [], isLoading, error } = useProducts();
  const { data: orders = [], isLoading: isLoadingOrders } = useStoreOrders();
  const refundPayment = useRefundPayment();
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
  const pendingOrders = orders.filter((order) => order.status === 'PENDING_PAYMENT').length;
  const orderRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const errorMessage =
    error instanceof Error ? error.message : 'Não foi possível carregar a lojinha.';

  const closeRefundDialog = () => {
    setRefundPaymentId(null);
    setRefundAmount('');
    setRefundReason('');
    setRestockItems(false);
  };

  const submitRefund = async () => {
    if (!refundPaymentId || refundReason.trim().length === 0) {
      return;
    }

    await refundPayment.mutateAsync({
      paymentId: refundPaymentId,
      amount: refundAmount.trim() ? Number(refundAmount.replace(',', '.')) : undefined,
      reason: refundReason.trim(),
      restockItems,
    });
    closeRefundDialog();
  };

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
                  title="Pedidos recentes"
                  subtitle={`${pendingOrders} pendentes`}
                  value={orders.length.toString()}
                  icon={<ReceiptIcon color="secondary" />}
                  valueColor="secondary.main"
                  footnote={`Total em pedidos: ${formatCurrency(orderRevenue)}`}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Card
                  title="Valor em prateleira"
                  subtitle="Preço de venda dos produtos disponíveis"
                  density="compact"
                >
                  <Typography variant="h4" fontWeight={800} color="secondary.main">
                    {formatCurrency(shelfValue)}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={8}>
                <Card title="Pedidos da loja" subtitle="Últimos pedidos do app" density="compact">
                  <Stack spacing={1.5}>
                    {isLoadingOrders ? (
                      <Typography variant="body2" color="text.secondary">
                        Carregando pedidos...
                      </Typography>
                    ) : orders.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Nenhum pedido criado ainda.
                      </Typography>
                    ) : (
                      orders.slice(0, 5).map((order) => {
                        const payment = order.payments[0];
                        const canRefund =
                          payment?.status === 'PAID' ||
                          payment?.status === 'PARTIALLY_REFUNDED';

                        return (
                          <Box
                            key={order.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 2,
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              pb: 1,
                            }}
                          >
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700}>
                                {order.number}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {order.client?.user?.name ?? 'Cliente'} · {order.items.length} item(ns)
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip label={order.status} size="small" variant="outlined" />
                              {payment ? (
                                <Chip
                                  label={payment.status}
                                  size="small"
                                  color={payment.status === 'PAID' ? 'success' : 'default'}
                                />
                              ) : null}
                              <Typography variant="subtitle2" fontWeight={800}>
                                {formatCurrency(order.totalAmount)}
                              </Typography>
                              {payment && canRefund ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setRefundPaymentId(payment.id)}
                                >
                                  Estornar
                                </Button>
                              ) : null}
                            </Stack>
                          </Box>
                        );
                      })
                    )}
                  </Stack>
                </Card>
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
            <Dialog open={refundPaymentId != null} onClose={closeRefundDialog} fullWidth maxWidth="sm">
              <DialogTitle>Estornar pagamento</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    label="Valor do estorno"
                    placeholder="Vazio para estorno total"
                    value={refundAmount}
                    onChange={(event) => setRefundAmount(event.target.value)}
                    inputProps={{ inputMode: 'decimal' }}
                  />
                  <TextField
                    label="Motivo"
                    required
                    multiline
                    minRows={3}
                    value={refundReason}
                    onChange={(event) => setRefundReason(event.target.value)}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={restockItems}
                        onChange={(event) => setRestockItems(event.target.checked)}
                      />
                    }
                    label="Devolver itens ao estoque"
                  />
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={closeRefundDialog}>Cancelar</Button>
                <Button
                  variant="contained"
                  onClick={submitRefund}
                  disabled={refundReason.trim().length === 0 || refundPayment.isLoading}
                >
                  Confirmar estorno
                </Button>
              </DialogActions>
            </Dialog>
          </Container>
        </Layout>
      </>
    </AuthGuard>
  );
};

export default ProductsPage;
