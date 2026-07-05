import React, { useMemo, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import {
  Alert,
  Box,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import RemoveIcon from '@mui/icons-material/Remove';
import SendIcon from '@mui/icons-material/Send';
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
  useCreateAppointment,
  useCreateTimeOff,
  useDeleteTimeOff,
  useMessageAppointmentClient,
  useOfferEarlierSlot,
  useStartAppointment,
  useTimeOffs,
  useUpdateAppointment,
} from '@/hooks/useAppointments';
import { useClients } from '@/hooks/useClients';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useServices } from '@/hooks/useServices';
import {
  formatAppointmentDate,
  formatAppointmentStatusLabel,
  formatAppointmentTime,
  formatCurrency,
  getAppointmentClientName,
  getAppointmentProfessionalName,
} from '@/lib/formatters/appointments';
import { entityGridProps, metricGridProps } from '@/lib/ui/gridPresets';
import { Appointment, AppointmentStatus } from '@/types';

type AppointmentDialogMode = 'create' | 'edit';

type AppointmentDraft = {
  id?: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  scheduledAt: string;
  notes: string;
};

const emptyAppointmentDraft: AppointmentDraft = {
  clientId: '',
  professionalId: '',
  serviceId: '',
  scheduledAt: '',
  notes: '',
};

type VisualScheduleSlot = {
  key: string;
  timeKey: string;
  appointment?: Appointment;
};

const visualScheduleBaseTimes = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];

const AppointmentsPage: NextPage = () => {
  const [appointmentDialogMode, setAppointmentDialogMode] =
    useState<AppointmentDialogMode | null>(null);
  const [appointmentDraft, setAppointmentDraft] = useState<AppointmentDraft>(
    emptyAppointmentDraft,
  );
  const [appointmentFeedback, setAppointmentFeedback] = useState<string | null>(null);
  const [visualScheduleDate, setVisualScheduleDate] = useState(() =>
    formatDateInputValue(new Date()),
  );
  const [timeOffForm, setTimeOffForm] = useState({
    professionalId: '',
    title: 'Bloqueio de agenda',
    reason: '',
    startAt: '',
    endAt: '',
  });
  const { data: appointments, isLoading, error } = useAppointments();
  const { data: clients } = useClients();
  const { data: professionals } = useProfessionals();
  const { data: services } = useServices();
  const { data: timeOffs, isLoading: isLoadingTimeOffs } = useTimeOffs();
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const confirmAppointment = useConfirmAppointment();
  const messageClient = useMessageAppointmentClient();
  const offerEarlierSlot = useOfferEarlierSlot();
  const cancelWithPolicy = useCancelAppointmentWithPolicy();
  const checkinAppointment = useCheckinAppointment();
  const startAppointment = useStartAppointment();
  const completeAppointment = useCompleteAppointment();
  const createTimeOff = useCreateTimeOff();
  const deleteTimeOff = useDeleteTimeOff();
  const appointmentList = useMemo(() => appointments ?? [], [appointments]);
  const clientList = useMemo(() => clients ?? [], [clients]);
  const professionalList = useMemo(() => professionals ?? [], [professionals]);
  const serviceList = useMemo(() => services ?? [], [services]);
  const timeOffList = timeOffs ?? [];
  const selectedAppointmentService = serviceList.find(
    (service) => service.id === appointmentDraft.serviceId,
  );
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
  const decisionQueue = useMemo(
    () =>
      appointmentList
        .filter((appointment) => appointment.status === AppointmentStatus.SCHEDULED)
        .sort(
          (left, right) =>
            new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
        )
        .slice(0, 6),
    [appointmentList],
  );
  const visualScheduleSlots = useMemo(
    () => buildVisualScheduleSlots(appointmentList, visualScheduleDate),
    [appointmentList, visualScheduleDate],
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
  const isSavingAppointment = createAppointment.isLoading || updateAppointment.isLoading;
  const appointmentDialogTitle =
    appointmentDialogMode === 'edit' ? 'Alterar agendamento' : 'Novo agendamento';

  const openCreateAppointmentDialog = (scheduledAt = '') => {
    setAppointmentFeedback(null);
    setAppointmentDraft({
      ...emptyAppointmentDraft,
      scheduledAt,
    });
    setAppointmentDialogMode('create');
  };

  const openEditAppointmentDialog = (appointment: Appointment) => {
    setAppointmentFeedback(null);
    setAppointmentDraft({
      id: appointment.id,
      clientId: appointment.clientId,
      professionalId: appointment.professionalId,
      serviceId: appointment.serviceId,
      scheduledAt: formatDateTimeInputValue(appointment.scheduledAt),
      notes: appointment.notes ?? '',
    });
    setAppointmentDialogMode('edit');
  };

  const closeAppointmentDialog = () => {
    if (isSavingAppointment) {
      return;
    }

    setAppointmentDialogMode(null);
    setAppointmentDraft(emptyAppointmentDraft);
  };

  const updateAppointmentDraft = (field: keyof AppointmentDraft, value: string) => {
    setAppointmentDraft((current) => ({ ...current, [field]: value }));
  };

  const submitAppointmentDraft = () => {
    const service = serviceList.find((item) => item.id === appointmentDraft.serviceId);
    if (!service || !canSubmitAppointmentDraft(appointmentDraft)) {
      setAppointmentFeedback('Preencha cliente, profissional, serviço e horário válido.');
      return;
    }

    const payload = {
      clientId: appointmentDraft.clientId,
      professionalId: appointmentDraft.professionalId,
      serviceId: appointmentDraft.serviceId,
      scheduledAt: new Date(appointmentDraft.scheduledAt).toISOString(),
      durationMinutes: service.durationMinutes,
      price: service.price,
      notes: appointmentDraft.notes.trim() || undefined,
    };

    const onSuccess = () => {
      setAppointmentFeedback(null);
      setAppointmentDialogMode(null);
      setAppointmentDraft(emptyAppointmentDraft);
    };

    const onError = (mutationError: unknown) => {
      setAppointmentFeedback(
        mutationError instanceof Error
          ? mutationError.message
          : 'Não foi possível salvar o agendamento.',
      );
    };

    if (appointmentDialogMode === 'edit' && appointmentDraft.id) {
      updateAppointment.mutate(
        {
          id: appointmentDraft.id,
          data: payload,
        },
        { onSuccess, onError },
      );
      return;
    }

    createAppointment.mutate(payload, { onSuccess, onError });
  };

  const removeVisualScheduleSlot = (slot: VisualScheduleSlot) => {
    if (slot.appointment) {
      const confirmed = window.confirm(
        `Cancelar o agendamento de ${getAppointmentClientName(slot.appointment)} às ${formatAppointmentTime(
          slot.appointment.scheduledAt,
        )}?`,
      );

      if (!confirmed) {
        return;
      }

      cancelWithPolicy.mutate(slot.appointment.id, {
        onSuccess: (result) => {
          window.alert(
            result.feeApplies
              ? `Cancelado com taxa sugerida de ${formatCurrency(result.cancellationFee)}.`
              : 'Cancelado sem taxa pela política de 1 hora.',
          );
        },
      });
      return;
    }

    const start = new Date(getVisualSlotDateTimeValue(visualScheduleDate, slot.timeKey));
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    createTimeOff.mutate({
      title: 'Horário removido da agenda',
      reason: 'Removido pelo painel visual de agendamentos.',
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    });
  };

  return (
    <AuthGuard requireAdmin>
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
              <Button
                variant="primary"
                startIcon={<AddIcon />}
                onClick={() => openCreateAppointmentDialog()}
              >
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

            <Card
              title="Agenda visual do dia"
              subtitle="Modelo simples para o Artur: horário ocupado mostra o nome; horário livre mostra aberto."
              density="compact"
              sx={{ mb: 4 }}
              action={
                <TextField
                  type="date"
                  size="small"
                  value={visualScheduleDate}
                  onChange={(event) => setVisualScheduleDate(event.target.value)}
                  inputProps={{ 'aria-label': 'Data da agenda visual' }}
                />
              }
            >
              <Grid container spacing={1.5}>
                {visualScheduleSlots.map((slot) => {
                  const scheduledAt = getVisualSlotDateTimeValue(
                    visualScheduleDate,
                    slot.timeKey,
                  );
                  const isOccupied = Boolean(slot.appointment);
                  const title = isOccupied
                    ? getAppointmentClientName(slot.appointment!)
                    : 'Horário Aberto';

                  return (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={slot.key}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0, 1fr) 34px',
                          gap: 0.5,
                          alignItems: 'stretch',
                          minHeight: 118,
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: '#050505',
                            color: '#FFFFFF',
                            borderRadius: 1,
                            p: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            overflow: 'hidden',
                          }}
                        >
                          <Box>
                            <Typography variant="caption" fontWeight={800} lineHeight={1.05}>
                              Agendamento
                            </Typography>
                            <Typography variant="body2" fontWeight={800} lineHeight={1.1}>
                              {slot.timeKey} horas
                            </Typography>
                          </Box>
                          <Typography
                            variant="h6"
                            fontWeight={900}
                            lineHeight={1.05}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              wordBreak: 'break-word',
                            }}
                          >
                            {title}
                          </Typography>
                        </Box>

                        <Stack alignItems="center" justifyContent="space-between">
                          <Tooltip title={isOccupied ? 'Adicionar encaixe' : 'Adicionar agendamento'}>
                            <span>
                              <IconButton
                                aria-label={
                                  isOccupied ? 'Adicionar encaixe' : 'Adicionar agendamento'
                                }
                                size="small"
                                onClick={() => openCreateAppointmentDialog(scheduledAt)}
                                sx={{
                                  color: '#1827E8',
                                  '& .MuiSvgIcon-root': { fontSize: 32 },
                                }}
                              >
                                <AddIcon fontSize="inherit" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip
                            title={isOccupied ? 'Cancelar agendamento' : 'Remover horário'}
                          >
                            <span>
                              <IconButton
                                aria-label={
                                  isOccupied ? 'Cancelar agendamento' : 'Remover horário'
                                }
                                size="small"
                                onClick={() => removeVisualScheduleSlot(slot)}
                                disabled={cancelWithPolicy.isLoading || createTimeOff.isLoading}
                                sx={{
                                  color: '#050505',
                                  '& .MuiSvgIcon-root': { fontSize: 32 },
                                }}
                              >
                                <RemoveIcon fontSize="inherit" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Card>

            <Card
              title="Pedidos para o Artur decidir"
              subtitle="Confirme como está, altere o horário ou chame o cliente sem sair da agenda."
              density="compact"
              sx={{ mb: 4 }}
              action={
                <Chip
                  label={`${decisionQueue.length} pendente${decisionQueue.length === 1 ? '' : 's'}`}
                  color={decisionQueue.length > 0 ? 'warning' : 'success'}
                  variant="outlined"
                  size="small"
                />
              }
            >
              {isLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Carregando pedidos...
                </Typography>
              ) : decisionQueue.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhum pedido aguardando decisão agora.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {decisionQueue.map((appointment) => (
                    <Box
                      key={appointment.id}
                      sx={(theme) => ({
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        px: 1.5,
                        py: 1.25,
                        display: 'flex',
                        alignItems: { xs: 'stretch', md: 'center' },
                        justifyContent: 'space-between',
                        gap: 1.5,
                        flexDirection: { xs: 'column', md: 'row' },
                        bgcolor: 'background.default',
                      })}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap>
                          {getAppointmentClientName(appointment)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {appointment.service?.name ?? 'Serviço não informado'} •{' '}
                          {getAppointmentProfessionalName(appointment)}
                        </Typography>
                        <Typography variant="body2" color="primary" fontWeight={600}>
                          {formatAppointmentDate(appointment.scheduledAt)} às{' '}
                          {formatAppointmentTime(appointment.scheduledAt)}
                        </Typography>
                      </Box>

                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        sx={{ gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}
                      >
                        <Button
                          variant="success"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => confirmAppointment.mutate(appointment.id)}
                          disabled={confirmAppointment.isLoading}
                        >
                          Confirmar como está
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditCalendarIcon />}
                          onClick={() => openEditAppointmentDialog(appointment)}
                        >
                          Alterar
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<SendIcon />}
                          onClick={() =>
                            messageClient.mutate(appointment.id, {
                              onSuccess: (result) => window.alert(result.message),
                            })
                          }
                          disabled={messageClient.isLoading}
                        >
                          Mensagem
                        </Button>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
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
                            Confirmar como está
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => openEditAppointmentDialog(appointment)}
                            disabled={appointment.status === AppointmentStatus.CANCELLED}
                          >
                            Alterar
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

            <Dialog
              open={appointmentDialogMode !== null}
              onClose={closeAppointmentDialog}
              fullWidth
              maxWidth="sm"
            >
              <DialogTitle>{appointmentDialogTitle}</DialogTitle>
              <DialogContent dividers>
                <Stack spacing={2.5} sx={{ pt: 1 }}>
                  {appointmentFeedback ? (
                    <Alert severity="error">{appointmentFeedback}</Alert>
                  ) : null}

                  <TextField
                    select
                    fullWidth
                    label="Cliente"
                    value={appointmentDraft.clientId}
                    onChange={(event) => updateAppointmentDraft('clientId', event.target.value)}
                    SelectProps={{ native: true }}
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clientList.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.user?.name ?? client.user?.email ?? 'Cliente sem nome'}
                      </option>
                    ))}
                  </TextField>

                  <TextField
                    select
                    fullWidth
                    label="Profissional"
                    value={appointmentDraft.professionalId}
                    onChange={(event) =>
                      updateAppointmentDraft('professionalId', event.target.value)
                    }
                    SelectProps={{ native: true }}
                    required
                  >
                    <option value="">Selecione um profissional</option>
                    {professionalList.map((professional) => (
                      <option key={professional.id} value={professional.id}>
                        {professional.user?.name ?? professional.specialty ?? 'Profissional'}
                      </option>
                    ))}
                  </TextField>

                  <TextField
                    select
                    fullWidth
                    label="Serviço"
                    value={appointmentDraft.serviceId}
                    onChange={(event) => updateAppointmentDraft('serviceId', event.target.value)}
                    SelectProps={{ native: true }}
                    required
                  >
                    <option value="">Selecione um serviço</option>
                    {serviceList.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {formatCurrency(service.price)} - {service.durationMinutes} min
                      </option>
                    ))}
                  </TextField>

                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Data e horário"
                    value={appointmentDraft.scheduledAt}
                    onChange={(event) =>
                      updateAppointmentDraft('scheduledAt', event.target.value)
                    }
                    InputLabelProps={{ shrink: true }}
                    required
                  />

                  <TextField
                    fullWidth
                    label="Observações"
                    value={appointmentDraft.notes}
                    onChange={(event) => updateAppointmentDraft('notes', event.target.value)}
                    multiline
                    minRows={2}
                  />

                  {selectedAppointmentService ? (
                    <Alert severity="info">
                      {selectedAppointmentService.name}: {selectedAppointmentService.durationMinutes}{' '}
                      min, {formatCurrency(selectedAppointmentService.price)}.
                    </Alert>
                  ) : null}
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button variant="outlined" onClick={closeAppointmentDialog} disabled={isSavingAppointment}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={submitAppointmentDraft}
                  disabled={!canSubmitAppointmentDraft(appointmentDraft) || isSavingAppointment}
                >
                  {isSavingAppointment
                    ? 'Salvando...'
                    : appointmentDialogMode === 'edit'
                      ? 'Salvar alteração'
                      : 'Criar agendamento'}
                </Button>
              </DialogActions>
            </Dialog>
          </Container>
        </Layout>
      </>
    </AuthGuard>
  );
};

function canSubmitAppointmentDraft(form: AppointmentDraft) {
  if (!form.clientId || !form.professionalId || !form.serviceId || !form.scheduledAt) {
    return false;
  }

  return Number.isFinite(new Date(form.scheduledAt).getTime());
}

function formatDateTimeInputValue(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '';
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function formatDateInputValue(value: Date) {
  const timezoneOffsetMs = value.getTimezoneOffset() * 60 * 1000;
  return new Date(value.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

function getVisualSlotDateTimeValue(dateValue: string, timeKey: string) {
  return `${dateValue}T${timeKey}`;
}

function buildVisualScheduleSlots(
  appointments: Appointment[],
  dateValue: string,
): VisualScheduleSlot[] {
  const appointmentsByTime = new Map(
    appointments
      .filter(
        (appointment) =>
          appointment.status !== AppointmentStatus.CANCELLED &&
          formatDateInputValue(new Date(appointment.scheduledAt)) === dateValue,
      )
      .map((appointment) => [formatAppointmentTime(appointment.scheduledAt), appointment]),
  );

  return visualScheduleBaseTimes.map((timeKey) => ({
    key: `${dateValue}-${timeKey}`,
    timeKey,
    appointment: appointmentsByTime.get(timeKey),
  }));
}

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
