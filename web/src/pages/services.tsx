import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import LayersIcon from '@mui/icons-material/Layers';
import TuneIcon from '@mui/icons-material/Tune';
import {
  Alert,
  Box,
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
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  ServicePayload,
  useCreateService,
  useDeactivateService,
  useServices,
  useUpdateService,
} from '@/hooks/useServices';
import { formatCurrency } from '@/lib/formatters/appointments';
import { entityGridProps, metricGridProps } from '@/lib/ui/gridPresets';
import { Service } from '@/types';

type ServiceDialogMode = 'create' | 'edit';

type ServiceDraft = {
  id?: string;
  name: string;
  description: string;
  durationMinutes: string;
  price: string;
  bufferBeforeMinutes: string;
  bufferAfterMinutes: string;
  parallelAllowed: boolean;
  active: boolean;
};

const emptyServiceDraft: ServiceDraft = {
  name: '',
  description: '',
  durationMinutes: '30',
  price: '',
  bufferBeforeMinutes: '0',
  bufferAfterMinutes: '0',
  parallelAllowed: false,
  active: true,
};

const ServicesPage: NextPage = () => {
  const { data: services = [], isLoading, error } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deactivateService = useDeactivateService();
  const [dialogMode, setDialogMode] = React.useState<ServiceDialogMode | null>(null);
  const [draft, setDraft] = React.useState<ServiceDraft>(emptyServiceDraft);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const activeServices = services.filter((service) => service.active).length;
  const averagePrice = services.length
    ? services.reduce((sum, service) => sum + service.price, 0) / services.length
    : 0;
  const averageDuration = services.length
    ? services.reduce((sum, service) => sum + service.durationMinutes, 0) / services.length
    : 0;
  const errorMessage =
    error instanceof Error ? error.message : 'Não foi possível carregar os serviços.';
  const isSaving = createService.isLoading || updateService.isLoading;
  const dialogTitle = dialogMode === 'edit' ? 'Editar serviço' : 'Adicionar serviço';

  const openCreateDialog = () => {
    setFeedback(null);
    setDraft(emptyServiceDraft);
    setDialogMode('create');
  };

  const openEditDialog = (service: Service) => {
    setFeedback(null);
    setDraft({
      id: service.id,
      name: service.name,
      description: service.description ?? '',
      durationMinutes: String(service.durationMinutes),
      price: toInputNumber(service.price),
      bufferBeforeMinutes: String(service.bufferBeforeMinutes),
      bufferAfterMinutes: String(service.bufferAfterMinutes),
      parallelAllowed: service.parallelAllowed,
      active: service.active,
    });
    setDialogMode('edit');
  };

  const closeDialog = () => {
    if (isSaving) {
      return;
    }

    resetDialog();
  };

  const resetDialog = () => {
    setDialogMode(null);
    setFeedback(null);
    setDraft(emptyServiceDraft);
  };

  const updateDraft = <K extends keyof ServiceDraft>(field: K, value: ServiceDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const submitDraft = () => {
    const payload = buildServicePayload(draft);
    if (!payload) {
      setFeedback('Informe nome, duração, preço e buffers válidos.');
      return;
    }

    const onSuccess = resetDialog;
    const onError = (mutationError: unknown) => {
      setFeedback(
        mutationError instanceof Error
          ? mutationError.message
          : 'Não foi possível salvar o serviço.',
      );
    };

    if (dialogMode === 'edit' && draft.id) {
      updateService.mutate({ id: draft.id, payload }, { onSuccess, onError });
      return;
    }

    createService.mutate(payload, { onSuccess, onError });
  };

  const confirmDeactivate = (service: Service) => {
    const confirmed = window.confirm(
      `Desativar "${service.name}"? Ele deixa de aparecer para novos agendamentos.`,
    );

    if (confirmed) {
      deactivateService.mutate(service.id);
    }
  };

  return (
    <AuthGuard requireAdmin>
      <>
        <Head>
          <title>Serviços - Barbearia do Artur</title>
          <meta name="description" content="Gerenciar serviços da Barbearia do Artur" />
        </Head>

        <Layout title="Serviços">
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
                  Serviços
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Corte, barba, sobrancelha, luzes, tranças e pacotes do Artur.
                </Typography>
              </Box>
              <Button
                variant="primary"
                startIcon={<AddIcon />}
                onClick={openCreateDialog}
                sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}
              >
                Adicionar serviço
              </Button>
            </Box>

            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Total de serviços"
                  subtitle="Catálogo cadastrado"
                  value={services.length.toString()}
                  icon={<BusinessCenterIcon color="primary" />}
                  footnote="Quantidade total disponível na operação."
                  onClick={() => scrollToSection('service-list')}
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
                  onClick={() => scrollToSection('service-list')}
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
                  onClick={() => scrollToSection('service-list')}
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
                  onClick={() => scrollToSection('service-list')}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2.5} id="service-list" sx={{ scrollMarginTop: 24 }}>
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
                      onClick={() => openEditDialog(service)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openEditDialog(service);
                        }
                      }}
                      sx={{
                        minHeight: { xs: 282, md: 298 },
                        '&:focus-visible': {
                          outline: '2px solid',
                          outlineColor: 'primary.main',
                          outlineOffset: 2,
                        },
                      }}
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

                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditDialog(service);
                            }}
                          >
                            Editar
                          </Button>
                          {service.active ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={(event) => {
                                event.stopPropagation();
                                confirmDeactivate(service);
                              }}
                              disabled={deactivateService.isLoading}
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
                        Nenhum serviço encontrado.
                      </Typography>
                      <Button variant="primary" startIcon={<AddIcon />} onClick={openCreateDialog}>
                        Cadastrar primeiro serviço
                      </Button>
                    </Stack>
                  </Card>
                </Grid>
              )}
            </Grid>

            <Dialog open={dialogMode !== null} onClose={closeDialog} fullWidth maxWidth="sm">
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogContent dividers>
                <Stack spacing={2.5} sx={{ pt: 1 }}>
                  {feedback ? <Alert severity="error">{feedback}</Alert> : null}
                  <TextField
                    fullWidth
                    required
                    label="Nome do serviço"
                    value={draft.name}
                    onChange={(event) => updateDraft('name', event.target.value)}
                  />
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Descrição"
                    value={draft.description}
                    onChange={(event) => updateDraft('description', event.target.value)}
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        required
                        label="Duração em minutos"
                        value={draft.durationMinutes}
                        onChange={(event) => updateDraft('durationMinutes', event.target.value)}
                        inputProps={{ inputMode: 'numeric' }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        required
                        label="Preço"
                        value={draft.price}
                        onChange={(event) => updateDraft('price', event.target.value)}
                        inputProps={{ inputMode: 'decimal' }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Buffer antes"
                        value={draft.bufferBeforeMinutes}
                        onChange={(event) =>
                          updateDraft('bufferBeforeMinutes', event.target.value)
                        }
                        inputProps={{ inputMode: 'numeric' }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Buffer depois"
                        value={draft.bufferAfterMinutes}
                        onChange={(event) =>
                          updateDraft('bufferAfterMinutes', event.target.value)
                        }
                        inputProps={{ inputMode: 'numeric' }}
                      />
                    </Grid>
                  </Grid>
                  <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={draft.active}
                          onChange={(event) => updateDraft('active', event.target.checked)}
                        />
                      }
                      label="Serviço ativo"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={draft.parallelAllowed}
                          onChange={(event) =>
                            updateDraft('parallelAllowed', event.target.checked)
                          }
                        />
                      }
                      label="Permite execução paralela"
                    />
                  </Stack>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button variant="outlined" onClick={closeDialog} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={submitDraft}
                  disabled={!canSubmitServiceDraft(draft) || isSaving}
                >
                  {isSaving
                    ? 'Salvando...'
                    : dialogMode === 'edit'
                      ? 'Salvar serviço'
                      : 'Adicionar serviço'}
                </Button>
              </DialogActions>
            </Dialog>
          </Container>
        </Layout>
      </>
    </AuthGuard>
  );
};

function canSubmitServiceDraft(form: ServiceDraft) {
  return buildServicePayload(form) != null;
}

function buildServicePayload(form: ServiceDraft): ServicePayload | null {
  const durationMinutes = parseInteger(form.durationMinutes);
  const price = parseDecimal(form.price);
  const bufferBeforeMinutes = parseInteger(form.bufferBeforeMinutes);
  const bufferAfterMinutes = parseInteger(form.bufferAfterMinutes);

  if (
    !form.name.trim() ||
    durationMinutes == null ||
    durationMinutes < 1 ||
    price == null ||
    bufferBeforeMinutes == null ||
    bufferAfterMinutes == null
  ) {
    return null;
  }

  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    durationMinutes,
    price,
    bufferBeforeMinutes,
    bufferAfterMinutes,
    parallelAllowed: form.parallelAllowed,
    active: form.active,
  };
}

function parseDecimal(value: string) {
  const normalized = value.trim().replace(',', '.');
  const numberValue = Number(normalized);
  return normalized && Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
}

function parseInteger(value: string) {
  const numberValue = Number(value.trim());
  return Number.isInteger(numberValue) && numberValue >= 0 ? numberValue : null;
}

function toInputNumber(value?: number | null) {
  return value == null ? '' : String(value);
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default ServicesPage;
