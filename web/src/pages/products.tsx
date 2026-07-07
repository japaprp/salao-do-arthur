import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import InventoryIcon from '@mui/icons-material/Inventory2';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import WarningIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Alert,
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
import {
  ProductPayload,
  useCreateProduct,
  useDeactivateProduct,
  useProducts,
  useRefundPayment,
  useStoreOrders,
  useUpdateProduct,
} from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/formatters/appointments';
import { entityGridProps, metricGridProps } from '@/lib/ui/gridPresets';
import { Product } from '@/types';

type ProductDialogMode = 'create' | 'edit';

type ProductDraft = {
  id?: string;
  name: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  availableQty: string;
  reorderPoint: string;
  safetyStock: string;
  featured: boolean;
  active: boolean;
  shippable: boolean;
  trackInventory: boolean;
};

const emptyProductDraft: ProductDraft = {
  name: '',
  sku: '',
  shortDescription: '',
  description: '',
  price: '',
  compareAtPrice: '',
  costPrice: '',
  availableQty: '0',
  reorderPoint: '0',
  safetyStock: '0',
  featured: false,
  active: true,
  shippable: true,
  trackInventory: true,
};

const ProductsPage: NextPage = () => {
  const [productDialogMode, setProductDialogMode] =
    React.useState<ProductDialogMode | null>(null);
  const [productDraft, setProductDraft] = React.useState<ProductDraft>(emptyProductDraft);
  const [productFeedback, setProductFeedback] = React.useState<string | null>(null);
  const [refundPaymentId, setRefundPaymentId] = React.useState<string | null>(null);
  const [refundAmount, setRefundAmount] = React.useState('');
  const [refundReason, setRefundReason] = React.useState('');
  const [restockItems, setRestockItems] = React.useState(false);
  const { data: products = [], isLoading, error } = useProducts();
  const { data: orders = [], isLoading: isLoadingOrders } = useStoreOrders();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deactivateProduct = useDeactivateProduct();
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
  const isSavingProduct = createProduct.isLoading || updateProduct.isLoading;
  const productDialogTitle =
    productDialogMode === 'edit' ? 'Editar produto' : 'Adicionar produto';

  const openCreateProductDialog = () => {
    setProductFeedback(null);
    setProductDraft(emptyProductDraft);
    setProductDialogMode('create');
  };

  const openEditProductDialog = (product: Product) => {
    setProductFeedback(null);
    setProductDraft({
      id: product.id,
      name: product.name,
      sku: product.sku ?? '',
      shortDescription: product.shortDescription ?? '',
      description: product.description ?? '',
      price: toInputNumber(product.price),
      compareAtPrice: toInputNumber(product.compareAtPrice),
      costPrice: '',
      availableQty: String(product.inventory?.availableQty ?? 0),
      reorderPoint: String(product.inventory?.reorderPoint ?? 0),
      safetyStock: String(product.inventory?.safetyStock ?? 0),
      featured: product.featured,
      active: product.active,
      shippable: product.shippable,
      trackInventory: product.trackInventory,
    });
    setProductDialogMode('edit');
  };

  const closeProductDialog = () => {
    if (isSavingProduct) {
      return;
    }

    resetProductDialog();
  };

  const resetProductDialog = () => {
    setProductDialogMode(null);
    setProductFeedback(null);
    setProductDraft(emptyProductDraft);
  };

  const updateProductDraft = <K extends keyof ProductDraft>(
    field: K,
    value: ProductDraft[K],
  ) => {
    setProductDraft((current) => ({ ...current, [field]: value }));
  };

  const submitProductDraft = () => {
    const payload = buildProductPayload(productDraft);
    if (!payload) {
      setProductFeedback('Informe nome, preço válido e estoque sem números negativos.');
      return;
    }

    const onSuccess = resetProductDialog;
    const onError = (mutationError: unknown) => {
      setProductFeedback(
        mutationError instanceof Error
          ? mutationError.message
          : 'Não foi possível salvar o produto.',
      );
    };

    if (productDialogMode === 'edit' && productDraft.id) {
      updateProduct.mutate({ id: productDraft.id, payload }, { onSuccess, onError });
      return;
    }

    createProduct.mutate(payload, { onSuccess, onError });
  };

  const confirmDeactivateProduct = (product: Product) => {
    const confirmed = window.confirm(
      `Desativar "${product.name}" da lojinha? Ele deixa de aparecer para venda.`,
    );

    if (confirmed) {
      deactivateProduct.mutate(product.id);
    }
  };

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
    <AuthGuard requireAdmin>
      <>
        <Head>
          <title>Lojinha - Barbearia do Artur</title>
          <meta name="description" content="Produtos da lojinha da Barbearia do Artur" />
        </Head>

        <Layout title="Lojinha">
          <Container maxWidth="xl">
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', md: 'center' }}
              gap={2}
              flexDirection={{ xs: 'column', md: 'row' }}
              mb={4}
            >
              <Box>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                  Lojinha
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Produtos para vender no balcão junto do corte, da barba e dos pacotes.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreateProductDialog}
                sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}
              >
                Adicionar produto
              </Button>
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

                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => openEditProductDialog(product)}
                          >
                            Editar
                          </Button>
                          {product.active ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => confirmDeactivateProduct(product)}
                              disabled={deactivateProduct.isLoading}
                            >
                              Desativar
                            </Button>
                          ) : null}
                        </Stack>
                      </Stack>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Card>
                    <Stack spacing={2} alignItems="flex-start">
                      <Typography variant="body1" color="text.secondary">
                        Nenhum produto encontrado.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={openCreateProductDialog}
                      >
                        Cadastrar primeiro produto
                      </Button>
                    </Stack>
                  </Card>
                </Grid>
              )}
            </Grid>

            <Dialog
              open={productDialogMode !== null}
              onClose={closeProductDialog}
              fullWidth
              maxWidth="md"
            >
              <DialogTitle>{productDialogTitle}</DialogTitle>
              <DialogContent dividers>
                <Stack spacing={2.5} sx={{ pt: 1 }}>
                  {productFeedback ? <Alert severity="error">{productFeedback}</Alert> : null}

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        required
                        label="Nome do produto"
                        value={productDraft.name}
                        onChange={(event) => updateProductDraft('name', event.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="SKU ou código"
                        value={productDraft.sku}
                        onChange={(event) => updateProductDraft('sku', event.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Descrição curta"
                        value={productDraft.shortDescription}
                        onChange={(event) =>
                          updateProductDraft('shortDescription', event.target.value)
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Descrição completa"
                        value={productDraft.description}
                        onChange={(event) =>
                          updateProductDraft('description', event.target.value)
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        required
                        label="Preço de venda"
                        value={productDraft.price}
                        onChange={(event) => updateProductDraft('price', event.target.value)}
                        inputProps={{ inputMode: 'decimal' }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Preço antigo"
                        value={productDraft.compareAtPrice}
                        onChange={(event) =>
                          updateProductDraft('compareAtPrice', event.target.value)
                        }
                        inputProps={{ inputMode: 'decimal' }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Custo"
                        value={productDraft.costPrice}
                        onChange={(event) => updateProductDraft('costPrice', event.target.value)}
                        inputProps={{ inputMode: 'decimal' }}
                      />
                    </Grid>

                    {productDraft.trackInventory ? (
                      <>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Quantidade em estoque"
                            value={productDraft.availableQty}
                            onChange={(event) =>
                              updateProductDraft('availableQty', event.target.value)
                            }
                            inputProps={{ inputMode: 'numeric' }}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Avisar reposição em"
                            value={productDraft.reorderPoint}
                            onChange={(event) =>
                              updateProductDraft('reorderPoint', event.target.value)
                            }
                            inputProps={{ inputMode: 'numeric' }}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Estoque de segurança"
                            value={productDraft.safetyStock}
                            onChange={(event) =>
                              updateProductDraft('safetyStock', event.target.value)
                            }
                            inputProps={{ inputMode: 'numeric' }}
                          />
                        </Grid>
                      </>
                    ) : null}
                  </Grid>

                  <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={productDraft.active}
                          onChange={(event) =>
                            updateProductDraft('active', event.target.checked)
                          }
                        />
                      }
                      label="Produto ativo"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={productDraft.featured}
                          onChange={(event) =>
                            updateProductDraft('featured', event.target.checked)
                          }
                        />
                      }
                      label="Destacar na loja"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={productDraft.shippable}
                          onChange={(event) =>
                            updateProductDraft('shippable', event.target.checked)
                          }
                        />
                      }
                      label="Pode vender na lojinha"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={productDraft.trackInventory}
                          onChange={(event) =>
                            updateProductDraft('trackInventory', event.target.checked)
                          }
                        />
                      }
                      label="Controlar estoque"
                    />
                  </Stack>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button variant="outlined" onClick={closeProductDialog} disabled={isSavingProduct}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={submitProductDraft}
                  disabled={!canSubmitProductDraft(productDraft) || isSavingProduct}
                >
                  {isSavingProduct
                    ? 'Salvando...'
                    : productDialogMode === 'edit'
                      ? 'Salvar produto'
                      : 'Adicionar produto'}
                </Button>
              </DialogActions>
            </Dialog>

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

function canSubmitProductDraft(form: ProductDraft) {
  return buildProductPayload(form) != null;
}

function buildProductPayload(form: ProductDraft): ProductPayload | null {
  const price = parseDecimal(form.price);
  if (!form.name.trim() || price == null) {
    return null;
  }

  const compareAtPrice = parseOptionalDecimal(form.compareAtPrice);
  const costPrice = parseOptionalDecimal(form.costPrice);
  const availableQty = parseInteger(form.availableQty);
  const reorderPoint = parseInteger(form.reorderPoint);
  const safetyStock = parseInteger(form.safetyStock);

  if (
    compareAtPrice === false ||
    costPrice === false ||
    availableQty == null ||
    reorderPoint == null ||
    safetyStock == null
  ) {
    return null;
  }

  return {
    name: form.name.trim(),
    sku: form.sku.trim() || undefined,
    shortDescription: form.shortDescription.trim() || undefined,
    description: form.description.trim() || undefined,
    price,
    compareAtPrice: compareAtPrice ?? undefined,
    costPrice: costPrice ?? undefined,
    featured: form.featured,
    active: form.active,
    shippable: form.shippable,
    trackInventory: form.trackInventory,
    inventory: form.trackInventory
      ? {
          availableQty,
          reorderPoint,
          safetyStock,
        }
      : undefined,
  };
}

function parseDecimal(value: string) {
  const normalized = value.trim().replace(',', '.');
  const numberValue = Number(normalized);
  return normalized && Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
}

function parseOptionalDecimal(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = parseDecimal(value);
  return parsed == null ? false : parsed;
}

function parseInteger(value: string) {
  const numberValue = Number(value.trim());
  return Number.isInteger(numberValue) && numberValue >= 0 ? numberValue : null;
}

function toInputNumber(value?: number | null) {
  return value == null ? '' : String(value);
}

export default ProductsPage;
