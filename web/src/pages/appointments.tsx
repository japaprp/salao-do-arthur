import React, { useMemo, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { Box, Chip, Container, Grid, Stack, TextField, Typography } from '@mui/material';
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
  useCheckinAppointment,
  useCompleteAppointment,
  useConfirmAppointment,
  useCreateTimeOff,
  useDeleteTimeOff,
  useMessageAppointmentClient,
  useOfferEarlierSlot,
  useStartAppointment,
  useTimeOffs,
} from '@/hooks/useAppointments';
import { useProfessionals } from '@/hooks/useProfessionals';
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
  const [timeOffForm, setTimeOffForm] = useState({
    professionalId: '',
    title: 'Bloqueio de agenda',
    reason: '',
    startAt: '',
    endAt: '',
  });
  const { data: appointments, isLoading, error } = useAppointments();
  const { data: professionals } = useProfessionals();
  const { data: timeOffs, isLoading: isLoadingTimeOffs } = useTimeOffs();
  const confirmAppointment = useConfirmAppointment();
  const messageClient = useMessageAppointmentClient();
  const offerEarlierSlot = useOfferEarlierSlot();
  const cancelWithPolicy = useCancelAppointmentWithPolicy();
  const checkinAppointment = useCheckinAppointment();
  const startAppointment = useStartAppointment();
  const completeAppointment = useCompleteAppointment();
  const createTimeOff = useCreateTimeOff();
  const deleteTimeOff = useDeleteTimeOff();
  const appointmentList = appointments ?? [];
  const professionalList = useMemo(() => professionals ?? [], [professionals]);
  const timeOffList = timeOffs ?? [];
  const professionalNameById = useMemo(
    () =>
      new Map(
        professionalList.map((professional) => [
          professional.id,
          professional.user?.name ?? professional.specialty ?? 'Profissional',
        ]),
      ),
    [professionalList],
  );
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
                  Agenda do Artur para confirmar, editar, oferecer vaga de desistência e aplicar política de cancelamento.
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

            <Card title="Bloqueios e folgas" density="compact" sx={{ mb: 4 }}>
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Use para bloquear um profissional ou a agenda inteira em folgas, encaixes internos e indisponibilidades.
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Profissional"
                      value={timeOffForm.professionalId}
                      onChange={(event) =>
                        setTimeOffForm((current) => ({
                          ...current,
                          professionalId: event.target.value,
                        }))
                      }
                      SelectProps={{ native: true }}
                    >
                      <option value="">Agenda inteira</option>
                      {professionalList.map((professional) => (
                        <option key={professional.id} value={professional.id}>
                          {professional.user?.name ?? professional.specialty ?? 'Profissional'}
                        </option>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Título"
                      value={timeOffForm.title}
                      onChange={(event) =>
                        setTimeOffForm((current) => ({ ...current, title: event.target.value }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Início"
                      value={timeOffForm.startAt}
                      onChange={(event) =>
                        setTimeOffForm((current) => ({ ...current, startAt: event.target.value }))
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Fim"
                      value={timeOffForm.endAt}
                      onChange={(event) =>
                        setTimeOffForm((current) => ({ ...current, endAt: event.target.value }))
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      variant="primary"
                      fullWidth
                      disabled={!canSubmitTimeOff(timeOffForm) || createTimeOff.isLoading}
                      onClick={() =>
                        createTimeOff.mutate(
                          {
                            professionalId: timeOffForm.professionalId || undefined,
                            title: timeOffForm.title.trim(),
                            reason: timeOffForm.reason.trim() || undefined,
                            startAt: new Date(timeOffForm.startAt).toISOString(),
                            endAt: new Date(timeOffForm.endAt).toISOString(),
                          },
                          {
                            onSuccess: () =>
                              setTimeOffForm({
                                professionalId: '',
                                title: 'Bloqueio de agenda',
                                reason: '',
                                startAt: '',
                                endAt: '',
                              }),
                          },
                        )
                      }
                    >
                      Bloquear
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Motivo"
                      value={timeOffForm.reason}
                      onChange={(event) =>
                        setTimeOffForm((current) => ({ ...current, reason: event.target.value }))
                      }
                    />
                  </Grid>
                </Grid>

                {isLoadingTimeOffs ? (
                  <Typography variant="body2" color="text.secondary">
                    Carregando bloqueios...
                  </Typography>
                ) : timeOffList.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Nenhum bloqueio ativo na agenda.
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                    {timeOffList.slice(0, 8).map((timeOff) => (
                      <Chip
                        key={timeOff.id}
                        label={`${timeOff.title} • ${
                          timeOff.professionalId
                            ? professionalNameById.get(timeOff.professionalId) ?? 'Profissional'
                            : 'Agenda inteira'
                        } • ${formatDateTimeLabel(timeOff.startAt)}`}
                        onDelete={() => deleteTimeOff.mutate(timeOff.id)}
                        color="default"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
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
                            disabled={appointment.status !== AppointmentStatus.SCHEDULED}
                          >
                            Confirmar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => checkinAppointment.mutate(appointment.id)}
                            disabled={appointment.status !== AppointmentStatus.SCHEDULED}
                          >
                            Check-in
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => startAppointment.mutate(appointment.id)}
                            disabled={appointment.status !== AppointmentStatus.CHECKED_IN}
                          >
                            Iniciar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => completeAppointment.mutate(appointment.id)}
                            disabled={appointment.status !== AppointmentStatus.IN_PROGRESS}
                          >
                            Finalizar
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
                                  message: buildDropoutAvailabilityMessage(
                                    getAppointmentClientName(appointment),
                                    buildEarlierSlotSuggestion(appointment.scheduledAt),
                                  ),
                                },
                                {
                                  onSuccess: (result) => window.alert(result.message),
                                },
                              )
                            }
                          >
                            Vaga de desistência
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

function buildDropoutAvailabilityMessage(clientName: string, proposedAt: string) {
  const label = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(proposedAt));

  return `Oi ${clientName}, surgiu uma desistência na Barbearia do Artur e abriu um horário para ${label}. Você tem disponibilidade para antecipar seu atendimento?`;
}

function canSubmitTimeOff(form: {
  title: string;
  startAt: string;
  endAt: string;
}) {
  if (!form.title.trim() || !form.startAt || !form.endAt) {
    return false;
  }

  return new Date(form.endAt).getTime() > new Date(form.startAt).getTime();
}

function formatDateTimeLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default AppointmentsPage;
