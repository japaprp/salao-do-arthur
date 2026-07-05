import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import ChecklistIcon from '@mui/icons-material/Checklist';
import PercentIcon from '@mui/icons-material/Percent';
import PersonIcon from '@mui/icons-material/Person';
import SpaIcon from '@mui/icons-material/Spa';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import {
  Alert,
  Box,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StatCard } from '@/components/dashboard/StatCard';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import {
  useProfessionals,
  useProfessionalServiceLinks,
  useSyncProfessionalServices,
} from '@/hooks/useProfessionals';
import { useServices } from '@/hooks/useServices';
import { entityGridProps, metricGridProps } from '@/lib/ui/gridPresets';
import { Professional, Service, SyncProfessionalServiceInput } from '@/types';

type EditableServiceLink = {
  enabled: boolean;
  customPrice: string;
  customDurationMinutes: string;
  sortOrder: string;
};

const ProfessionalsPage: NextPage = () => {
  const { data: professionals = [], isLoading, error } = useProfessionals();
  const { data: services = [] } = useServices();
  const syncProfessionalServices = useSyncProfessionalServices();
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [serviceDraft, setServiceDraft] = useState<Record<string, EditableServiceLink>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackSeverity, setFeedbackSeverity] = useState<'success' | 'error'>('success');
  const {
    data: professionalServiceLinks = [],
    isLoading: isLoadingProfessionalServices,
  } = useProfessionalServiceLinks(selectedProfessional?.id);

  const activeProfessionals = professionals.filter((professional) => professional.active).length;
  const totalActiveAssignments = professionals.reduce(
    (sum, professional) =>
      sum + (professional.serviceLinks?.filter((serviceLink) => serviceLink.active).length ?? 0),
    0,
  );
  const mappedSpecialties = new Set(
    professionals
      .map((professional) => professional.specialty?.trim())
      .filter((specialty): specialty is string => Boolean(specialty)),
  ).size;
  const averageCommission = professionals.length
    ? professionals.reduce(
        (sum, professional) => sum + professional.commissionPercent,
        0,
      ) / professionals.length
    : 0;
  const errorMessage =
    error instanceof Error ? error.message : 'Não foi possível carregar os profissionais.';

  useEffect(() => {
    if (!selectedProfessional) {
      return;
    }

    const nextDraft = services.reduce<Record<string, EditableServiceLink>>((accumulator, service) => {
      const existingLink = professionalServiceLinks.find(link => link.serviceId === service.id);

      accumulator[service.id] = {
        enabled: existingLink?.active ?? false,
        customPrice:
          existingLink?.customPrice != null ? existingLink.customPrice.toString() : '',
        customDurationMinutes:
          existingLink?.customDurationMinutes != null
            ? existingLink.customDurationMinutes.toString()
            : '',
        sortOrder:
          existingLink?.sortOrder != null
            ? existingLink.sortOrder.toString()
            : '',
      };

      return accumulator;
    }, {});

    setServiceDraft(nextDraft);
  }, [professionalServiceLinks, selectedProfessional, services]);

  const selectedProfessionalActiveServices = useMemo(
    () => professionalServiceLinks.filter(link => link.active),
    [professionalServiceLinks],
  );

  const openServiceManager = (professional: Professional) => {
    setFeedbackMessage(null);
    setSelectedProfessional(professional);
  };

  const closeServiceManager = () => {
    if (syncProfessionalServices.isPending) {
      return;
    }

    setSelectedProfessional(null);
    setServiceDraft({});
  };

  const updateDraft = (
    serviceId: string,
    field: keyof EditableServiceLink,
    value: string | boolean,
  ) => {
    setServiceDraft(currentState => ({
      ...currentState,
      [serviceId]: {
        ...currentState[serviceId],
        [field]: value,
      },
    }));
  };

  const handleSaveServiceLinks = async () => {
    if (!selectedProfessional) {
      return;
    }

    try {
      const payloadServices = buildSyncPayload(services, serviceDraft);

      await syncProfessionalServices.mutateAsync({
        professionalId: selectedProfessional.id,
        services: payloadServices,
      });

      setFeedbackSeverity('success');
      setFeedbackMessage('Vínculos do profissional atualizados com sucesso.');
      closeServiceManager();
    } catch (mutationError) {
      setFeedbackSeverity('error');
      setFeedbackMessage(
        mutationError instanceof Error
          ? mutationError.message
          : 'Não foi possível atualizar os serviços do profissional.',
      );
    }
  };

  return (
    <AuthGuard requireAdmin>
      <>
        <Head>
          <title>Profissionais - Barbearia do Artur</title>
          <meta name="description" content="Gerenciar profissionais da Barbearia do Artur" />
        </Head>

        <Layout title="Profissionais">
          <Container maxWidth="xl">
            <Box mb={4}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                Profissionais
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Equipe conectada aos dados reais do backend.
              </Typography>
            </Box>

            {feedbackMessage ? (
              <Alert severity={feedbackSeverity} sx={{ mb: 3 }}>
                {feedbackMessage}
              </Alert>
            ) : null}

            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Total de profissionais"
                  subtitle="Equipe cadastrada"
                  value={professionals.length.toString()}
                  icon={<PersonIcon color="primary" />}
                  footnote="Base operacional disponível no tenant."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Ativos na operação"
                  subtitle="Disponíveis para agenda"
                  value={activeProfessionals.toString()}
                  icon={<VerifiedUserIcon color="success" />}
                  valueColor="success.main"
                  footnote="Leitura direta da equipe em atuação."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Comissão média"
                  subtitle="Percentual da equipe"
                  value={`${averageCommission.toFixed(0)}%`}
                  icon={<PercentIcon color="warning" />}
                  valueColor="warning.main"
                  footnote="Faixa consolidada para leitura rápida."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Especialidades"
                  subtitle="Mapa técnico"
                  value={mappedSpecialties.toString()}
                  icon={<SpaIcon color="secondary" />}
                  valueColor="secondary.main"
                  footnote="Especialidades distintas já cadastradas."
                />
              </Grid>
              <Grid item {...metricGridProps}>
                <StatCard
                  title="Vínculos ativos"
                  subtitle="Profissional x serviço"
                  value={totalActiveAssignments.toString()}
                  icon={<ChecklistIcon color="info" />}
                  footnote="Base real que libera agenda por serviço."
                />
              </Grid>
            </Grid>

            <Grid container spacing={2.5}>
              {isLoading ? (
                <Grid item xs={12}>
                  <Card>
                    <Typography variant="body1" color="text.secondary">
                      Carregando profissionais...
                    </Typography>
                  </Card>
                </Grid>
              ) : error ? (
                <Grid item xs={12}>
                  <Card>
                    <Typography variant="body1" color="error">
                      Erro ao carregar profissionais: {errorMessage}
                    </Typography>
                  </Card>
                </Grid>
              ) : professionals.length > 0 ? (
                professionals.map((professional) => (
                  <Grid item {...entityGridProps} key={professional.id}>
                    <Card
                      title={professional.user?.name ?? 'Profissional sem nome'}
                      subtitle={professional.user?.email ?? 'Email não informado'}
                      density="compact"
                      sx={{ minHeight: { xs: 236, md: 248 } }}
                      action={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={professional.active ? 'Ativo' : 'Inativo'}
                            color={professional.active ? 'success' : 'default'}
                            size="small"
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => openServiceManager(professional)}
                          >
                            Serviços
                          </Button>
                        </Stack>
                      }
                    >
                      <Stack spacing={1.75} sx={{ height: '100%' }}>
                        <Box>
                          <Typography variant="h5" fontWeight={800} color="warning.main">
                            {professional.commissionPercent}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Comissão aplicada
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                          <Chip
                            icon={<WorkspacesIcon />}
                            label={professional.specialty ?? 'Atendimento geral'}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{
                              maxWidth: '100%',
                              '& .MuiChip-label': {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              },
                            }}
                          />
                          <Chip
                            label={`${
                              professional.serviceLinks?.filter((serviceLink) => serviceLink.active)
                                .length ?? 0
                            } serviços`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>

                        {(professional.serviceLinks?.filter(link => link.active).length ?? 0) > 0 ? (
                          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            {professional.serviceLinks
                              ?.filter(link => link.active)
                              .slice(0, 3)
                              .map(link => (
                                <Chip
                                  key={link.id}
                                  label={link.service?.name ?? 'Serviço'}
                                  size="small"
                                  variant="filled"
                                  color="default"
                                />
                              ))}
                          </Box>
                        ) : null}

                        <Stack spacing={0.65} sx={{ mt: 'auto' }}>
                          <Typography variant="body2" color="text.secondary">
                            {professional.user?.phone ?? 'Telefone não informado'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tenant {professional.tenantId}
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
                      Nenhum profissional encontrado.
                    </Typography>
                  </Card>
                </Grid>
              )}
            </Grid>

            <Dialog
              open={Boolean(selectedProfessional)}
              onClose={closeServiceManager}
              fullWidth
              maxWidth="md"
            >
              <DialogTitle>
                {selectedProfessional
                  ? `Serviços de ${selectedProfessional.user?.name ?? 'Profissional'}`
                  : 'Serviços do profissional'}
              </DialogTitle>
              <DialogContent dividers>
                {selectedProfessional ? (
                  <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      Ative os serviços que esse profissional realmente executa. O mobile e a agenda
                      passam a respeitar esse vínculo.
                    </Typography>

                    {isLoadingProfessionalServices ? (
                      <Box
                        sx={{
                          minHeight: 180,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Loading size="medium" />
                      </Box>
                    ) : services.length === 0 ? (
                      <Alert severity="warning">
                        Nenhum serviço cadastrado. Cadastre serviços antes de vincular profissionais.
                      </Alert>
                    ) : (
                      <Grid container spacing={2}>
                        {services.map(service => {
                          const draft = serviceDraft[service.id] ?? createDefaultDraft(service);

                          return (
                            <Grid item xs={12} md={6} key={service.id}>
                              <Card
                                title={service.name}
                                subtitle={service.description ?? 'Sem descrição operacional'}
                                density="compact"
                                sx={{ minHeight: 280 }}
                                action={
                                  <Chip
                                    size="small"
                                    color={service.active ? 'success' : 'default'}
                                    label={service.active ? 'Catálogo ativo' : 'Serviço inativo'}
                                  />
                                }
                              >
                                <Stack spacing={1.5}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={draft.enabled}
                                        onChange={(event) =>
                                          updateDraft(service.id, 'enabled', event.target.checked)
                                        }
                                      />
                                    }
                                    label="Profissional executa este serviço"
                                  />

                                  <Typography variant="body2" color="text.secondary">
                                    Base: R$ {service.price.toFixed(2)} • {service.durationMinutes} min
                                  </Typography>

                                  <Input
                                    label="Preço customizado"
                                    type="number"
                                    value={draft.customPrice}
                                    onChange={(event) =>
                                      updateDraft(service.id, 'customPrice', event.target.value)
                                    }
                                    disabled={!draft.enabled}
                                    inputProps={{ min: 0, step: '0.01' }}
                                    helperText="Deixe vazio para usar o preço padrão."
                                  />

                                  <Input
                                    label="Duração customizada (min)"
                                    type="number"
                                    value={draft.customDurationMinutes}
                                    onChange={(event) =>
                                      updateDraft(
                                        service.id,
                                        'customDurationMinutes',
                                        event.target.value,
                                      )
                                    }
                                    disabled={!draft.enabled}
                                    inputProps={{ min: 1, step: 1 }}
                                    helperText="Deixe vazio para usar a duração padrão."
                                  />

                                  <Input
                                    label="Ordem de exibição"
                                    type="number"
                                    value={draft.sortOrder}
                                    onChange={(event) =>
                                      updateDraft(service.id, 'sortOrder', event.target.value)
                                    }
                                    disabled={!draft.enabled}
                                    inputProps={{ min: 0, step: 1 }}
                                    helperText="Controla a ordenação desse serviço no profissional."
                                  />
                                </Stack>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    )}

                    {selectedProfessionalActiveServices.length > 0 ? (
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                          Vínculos ativos atuais
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                          {selectedProfessionalActiveServices.map(link => (
                            <Chip
                              key={link.id}
                              label={link.service?.name ?? 'Serviço'}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    ) : null}
                  </Stack>
                ) : null}
              </DialogContent>
              <DialogActions>
                <Button variant="outlined" onClick={closeServiceManager}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveServiceLinks}
                  disabled={syncProfessionalServices.isPending || services.length === 0}
                >
                  {syncProfessionalServices.isPending ? <Loading size="small" /> : 'Salvar vínculos'}
                </Button>
              </DialogActions>
            </Dialog>
          </Container>
        </Layout>
      </>
    </AuthGuard>
  );
};

export default ProfessionalsPage;

function createDefaultDraft(service: Service): EditableServiceLink {
  return {
    enabled: false,
    customPrice: '',
    customDurationMinutes: '',
    sortOrder: '',
  };
}

function buildSyncPayload(
  services: Service[],
  serviceDraft: Record<string, EditableServiceLink>,
): SyncProfessionalServiceInput[] {
  const payload: SyncProfessionalServiceInput[] = [];

  services.forEach((service, index) => {
    const draft = serviceDraft[service.id] ?? createDefaultDraft(service);
    if (!draft.enabled) {
      return;
    }

    payload.push({
      serviceId: service.id,
      customPrice: parseOptionalNumber(draft.customPrice),
      customDurationMinutes: parseOptionalInteger(draft.customDurationMinutes),
      active: true,
      sortOrder: parseSortOrder(draft.sortOrder, index),
    });
  });

  return payload.sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalInteger(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSortOrder(value: string, fallback: number): number {
  if (!value.trim()) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
