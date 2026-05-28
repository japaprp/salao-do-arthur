import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { Box, Chip, Container, Grid, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StatCard } from '@/components/dashboard/StatCard';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  useAppointments,
  useCancelAppointmentWithPolicy,
  useConfirmAppointment,
  useMessageAppointmentClient,
  useOfferEarlierSlot,
} from '@/hooks/useAppointments';
import {
  formatAppointmentDate,
  formatAppointmentStatusLabel,
  formatAppointmentTime,
  formatCurrency,
  getAppointmentClientName,
  getAppointmentProfessionalName,
} from '@/lib/formatters/appointments';
import { entityGridProps, metricGridProps } from '@/lib/ui/gridPresets';
import { AppointmentStatus } from '@/types';

const AppointmentsPage: NextPage = () => {
  const { data: appointments, isLoading, error } = useAppointments();
  const confirmAppointment = useConfirmAppointment();
  const messageClient = useMessageAppointmentClient();
  const offerEarlierSlot = useOfferEarlierSlot();
  const cancelWithPolicy = useCancelAppointmentWithPolicy();
  const appointmentList = appointments ?? [];
  const activeAppointments = appointmentList.filter(
    (appointment) => appointment.status !== AppointmentStatus.CANCELLED,
  );
  const projectedRevenue = activeAppointments.reduce(
    (total, appointment) => total + appointment.totalAmount,
    0,
  );
  const scheduledClients = new Set(appointmentList.map((appointment) => appointment.clientId)).size;
  const averageTicket = activeAppointments.length
    ? projectedRevenue / activeAppointments.length
    : 0;
  const errorMessage =
    error instanceof Error ? error.message : 'Não foi possível carregar os agendamentos.';

  return (
    <AuthGuard>
      <>
        <Head>
          <title>Agendamentos - Barbearia do Artur</title>
          <meta name="description" content="Gerenciar agendamentos da Barbearia do Artur" />
        </Head>

        <Layout title="Agendamentos">
          <Container maxWidth="xl">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <div>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                  Agendamentos
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Agenda do Artur para confirmar, editar, antecipar horário vago e aplicar política de cancelamento.
                </Typography>
              </div>
              <Button variant="primary" startIcon={<AddIcon />}>
                Novo Agendamento
              </Button>
            </Box>

            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Agendamentos"
                  subtitle="Carga da agenda"
                  value={appointmentList.length.toString()}
                  icon={<CalendarIcon color="primary" />}
                  footnote="Todos os registros carregados na visão atual."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Carteira ativa"
                  subtitle="Sem cancelados"
                  value={activeAppointments.length.toString()}
                  icon={<TrendingUpIcon color="secondary" />}
                  valueColor="secondary.main"
                  footnote="Atendimentos que seguem válidos na operação."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Receita prevista"
                  subtitle="Base atual da agenda"
                  value={formatCurrency(projectedRevenue)}
                  icon={<MoneyIcon color="success" />}
                  valueColor="success.main"
                  footnote="Soma dos atendimentos ainda ativos."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Clientes na agenda"
                  subtitle="Base vinculada"
                  value={scheduledClients.toString()}
                  icon={<PeopleIcon color="warning" />}
                  valueColor="warning.main"
                  footnote={`Ticket médio ${formatCurrency(averageTicket)}`}
                />
              </Grid>
            </Grid>

            <Card density="compact" sx={{ mb: 4 }}>
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                <Button variant="outlined" startIcon={<CalendarIcon />}>
                  Hoje
                </Button>
                <Button variant="outlined">Próximos 7 dias</Button>
                <Button variant="outlined">Todos os status</Button>
                <Chip
                  label="Cancelamento grátis até 1h antes; depois, taxa mínima R$ 20 ou 30%"
                  color="warning"
                  variant="outlined"
                />
              </Box>
            </Card>

            <Grid container spacing={2.5}>
              {isLoading ? (
                <Grid item xs={12}>
                  <Card>
                    <Typography variant="body1" color="text.secondary">
                      Carregando agendamentos...
                    </Typography>
                  </Card>
                </Grid>
              ) : error ? (
                <Grid item xs={12}>
                  <Card>
                    <Typography variant="body1" color="error">
                      Erro ao carregar agendamentos: {errorMessage}
                    </Typography>
                  </Card>
                </Grid>
              ) : appointmentList.length > 0 ? (
                appointmentList.map((appointment) => (
                  <Grid item {...entityGridProps} key={appointment.id}>
                    <Card
                      title={getAppointmentClientName(appointment)}
                      subtitle={`${formatAppointmentDate(appointment.scheduledAt)} • ${formatAppointmentTime(appointment.scheduledAt)}`}
                      density="compact"
                      hover
                      sx={{ minHeight: { xs: 244, md: 260 } }}
                      action={
                        <Chip
                          label={formatAppointmentStatusLabel(appointment.status)}
                          color={appointment.status === 'COMPLETED' ? 'success' : 'primary'}
                          variant={appointment.status === 'COMPLETED' ? 'filled' : 'outlined'}
                          size="small"
                        />
                      }
                    >
                      <Stack spacing={1.75} sx={{ height: '100%' }}>
                        <Box>
                          <Typography variant="h5" fontWeight={800} color="success.main">
                            {formatCurrency(appointment.totalAmount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Valor do atendimento
                          </Typography>
                        </Box>

                        <Stack spacing={0.65}>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.service?.name ?? 'Serviço não informado'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getAppointmentProfessionalName(appointment)}
                          </Typography>
                        </Stack>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 'auto',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {appointment.notes || 'Sem observações operacionais.'}
                        </Typography>

                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => confirmAppointment.mutate(appointment.id)}
                          >
                            Confirmar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() =>
                              messageClient.mutate(appointment.id, {
                                onSuccess: (result) => window.alert(result.message),
                              })
                            }
                          >
                            Mensagem
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() =>
                              offerEarlierSlot.mutate(
                                {
                                  id: appointment.id,
                                  proposedAt: buildEarlierSlotSuggestion(appointment.scheduledAt),
                                },
                                {
                                  onSuccess: (result) => window.alert(result.message),
                                },
                              )
                            }
                          >
                            Subir horário
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() =>
                              cancelWithPolicy.mutate(appointment.id, {
                                onSuccess: (result) => {
                                  window.alert(
                                    result.feeApplies
                                      ? `Cancelado com taxa sugerida de ${formatCurrency(
                                          result.cancellationFee,
                                        )}.`
                                      : 'Cancelado sem taxa pela política de 1 hora.',
                                  );
                                },
                              })
                            }
                          >
                            Cancelar
                          </Button>
                        </Stack>
                      </Stack>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Card>
                    <Typography variant="body1" color="text.secondary">
                      Nenhum agendamento encontrado.
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

function buildEarlierSlotSuggestion(scheduledAt: string) {
  const date = new Date(scheduledAt);
  date.setMinutes(date.getMinutes() - 30);
  return date.toISOString();
}

export default AppointmentsPage;
