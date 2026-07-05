import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import PaidIcon from '@mui/icons-material/Paid';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import SavingsIcon from '@mui/icons-material/Savings';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StatCard } from '@/components/dashboard/StatCard';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import {
  FinancePeriod,
  useCreateFinanceTransaction,
  useFinanceOverview,
} from '@/hooks/useFinance';
import { formatCurrency } from '@/lib/formatters/appointments';
import { metricGridProps, widePanelGridProps } from '@/lib/ui/gridPresets';

const periodOptions: Array<{ value: FinancePeriod; label: string }> = [
  { value: 'daily', label: 'Dia' },
  { value: 'weekly', label: 'Semana' },
  { value: 'monthly', label: 'Mês' },
  { value: 'yearly', label: 'Ano' },
];

const FinancePage: NextPage = () => {
  const [period, setPeriod] = React.useState<FinancePeriod>('monthly');
  const [type, setType] = React.useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [category, setCategory] = React.useState('OPERACIONAL');
  const [amount, setAmount] = React.useState('');
  const [description, setDescription] = React.useState('');
  const { data, isLoading, error } = useFinanceOverview(period);
  const createTransaction = useCreateFinanceTransaction();
  const summary = data?.summary;
  const errorMessage =
    error instanceof Error ? error.message : 'Não foi possível carregar o financeiro.';

  const submitTransaction = async () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !category.trim()) {
      return;
    }

    await createTransaction.mutateAsync({
      type,
      category: category.trim(),
      amount: parsedAmount,
      description: description.trim() || undefined,
    });
    setAmount('');
    setDescription('');
  };

  return (
    <AuthGuard requireAdmin>
      <>
        <Head>
          <title>Financeiro - Barbearia do Artur</title>
          <meta name="description" content="Financeiro administrativo da Barbearia do Artur" />
        </Head>

        <Layout title="Financeiro">
          <Container maxWidth="xl">
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap',
                mb: 4,
              }}
            >
              <Box>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                  Financeiro
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Caixa, receitas, despesas, comissões e lucro do salão.
                </Typography>
              </Box>
              <ToggleButtonGroup
                exclusive
                value={period}
                onChange={(_, value: FinancePeriod | null) => value && setPeriod(value)}
                size="small"
              >
                {periodOptions.map((option) => (
                  <ToggleButton key={option.value} value={option.value}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            ) : null}

            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Receitas"
                  subtitle="Atendimentos, loja e entradas"
                  value={formatCurrency(summary?.revenue ?? 0)}
                  icon={<MoneyIcon color="success" />}
                  valueColor="success.main"
                  footnote={`${summary?.appointmentCount ?? 0} atendimentos e ${summary?.orderCount ?? 0} pedidos.`}
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Despesas"
                  subtitle="Saídas confirmadas"
                  value={formatCurrency(summary?.expenses ?? 0)}
                  icon={<TrendingDownIcon color="error" />}
                  valueColor="error.main"
                  footnote={`${summary?.expenseCount ?? 0} lançamentos no período.`}
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Comissões"
                  subtitle="Equipe/profissionais"
                  value={formatCurrency(summary?.commissions ?? 0)}
                  icon={<PaidIcon color="warning" />}
                  valueColor="warning.main"
                  footnote={`${summary?.pendingCommissionCount ?? 0} pendentes: ${formatCurrency(summary?.pendingCommissionAmount ?? 0)}.`}
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Lucro"
                  subtitle="Receita - despesas - comissões"
                  value={formatCurrency(summary?.netProfit ?? 0)}
                  icon={<SavingsIcon color="primary" />}
                  valueColor={(summary?.netProfit ?? 0) >= 0 ? 'primary.main' : 'error.main'}
                  footnote="Resultado líquido do período selecionado."
                />
              </Grid>
            </Grid>

            {isLoading ? (
              <Card>
                <Loading size="large" text="Carregando financeiro..." />
              </Card>
            ) : (
              <Grid container spacing={2.5}>
                <Grid item {...widePanelGridProps}>
                  <Card title="Composição do caixa" subtitle="Entradas e saídas do período">
                    <Grid container spacing={2}>
                      {[
                        ['Atendimentos', summary?.appointmentRevenue ?? 0],
                        ['Loja', summary?.orderRevenue ?? 0],
                        ['Entradas manuais', summary?.manualIncome ?? 0],
                        ['Despesas', -(summary?.expenses ?? 0)],
                        ['Comissões', -(summary?.commissions ?? 0)],
                      ].map(([label, value]) => (
                        <Grid item xs={12} md={6} key={label as string}>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              {label}
                            </Typography>
                            <Typography
                              variant="h6"
                              fontWeight={800}
                              color={(value as number) >= 0 ? 'success.main' : 'error.main'}
                            >
                              {formatCurrency(value as number)}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Card>
                </Grid>

                <Grid item xs={12} lg={4}>
                  <Card title="Lançamento rápido" subtitle="Receita ou despesa manual">
                    <Stack spacing={2}>
                      <TextField
                        select
                        label="Tipo"
                        value={type}
                        onChange={(event) => setType(event.target.value as 'INCOME' | 'EXPENSE')}
                      >
                        <MenuItem value="EXPENSE">Despesa</MenuItem>
                        <MenuItem value="INCOME">Receita</MenuItem>
                      </TextField>
                      <TextField
                        label="Categoria"
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                      />
                      <TextField
                        label="Valor"
                        type="number"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                      />
                      <TextField
                        label="Descrição"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        multiline
                        minRows={2}
                      />
                      <Button
                        variant="contained"
                        startIcon={<ReceiptIcon />}
                        disabled={createTransaction.isPending}
                        onClick={submitTransaction}
                      >
                        Registrar
                      </Button>
                    </Stack>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card title="Movimentações recentes" subtitle="Últimos lançamentos do período">
                    <Stack spacing={1.25}>
                      {(data?.recentTransactions ?? []).length > 0 ? (
                        data!.recentTransactions.map((transaction) => (
                          <Box
                            key={transaction.id}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 2,
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: 'background.default',
                            }}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight={700}>
                                {transaction.category}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {transaction.description ?? transaction.status}
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              fontWeight={800}
                              color={transaction.type === 'EXPENSE' ? 'error.main' : 'success.main'}
                            >
                              {transaction.type === 'EXPENSE' ? '-' : '+'}
                              {formatCurrency(transaction.amount)}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Nenhuma movimentação manual no período selecionado.
                        </Typography>
                      )}
                    </Stack>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Container>
        </Layout>
      </>
    </AuthGuard>
  );
};

export default FinancePage;
