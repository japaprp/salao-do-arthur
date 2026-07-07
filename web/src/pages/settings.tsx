import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BusinessIcon from '@mui/icons-material/Business';
import SaveIcon from '@mui/icons-material/Save';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import {
  Alert,
  Box,
  Checkbox,
  Container,
  FormControlLabel,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AuthGuard } from '@/components/auth/AuthGuard';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  SalonSettingsPayload,
  useSalonSettings,
  useUpdateSalonSettings,
} from '@/hooks/useSettings';

type SettingsDraft = {
  salonName: string;
  legalName: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  appointmentLeadTimeMinutes: string;
  cancellationWindowHours: string;
  enableProductCatalog: boolean;
  enableCheckout: boolean;
  enableLoyalty: boolean;
  enableCashback: boolean;
  enableReferrals: boolean;
  allowWaitlist: boolean;
};

const emptySettingsDraft: SettingsDraft = {
  salonName: '',
  legalName: '',
  description: '',
  phone: '',
  whatsapp: '',
  email: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  appointmentLeadTimeMinutes: '60',
  cancellationWindowHours: '24',
  enableProductCatalog: true,
  enableCheckout: true,
  enableLoyalty: true,
  enableCashback: true,
  enableReferrals: true,
  allowWaitlist: true,
};

const SettingsPage: NextPage = () => {
  const { data: settings, isLoading, error } = useSalonSettings();
  const updateSettings = useUpdateSalonSettings();
  const [draft, setDraft] = React.useState<SettingsDraft>(emptySettingsDraft);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!settings) {
      return;
    }

    setDraft({
      salonName: settings.salonName,
      legalName: settings.legalName ?? '',
      description: settings.description ?? '',
      phone: settings.phone ?? '',
      whatsapp: settings.whatsapp ?? '',
      email: settings.email ?? '',
      instagram: settings.instagram ?? '',
      facebook: settings.facebook ?? '',
      tiktok: settings.tiktok ?? '',
      appointmentLeadTimeMinutes: String(settings.appointmentLeadTimeMinutes),
      cancellationWindowHours: String(settings.cancellationWindowHours),
      enableProductCatalog: settings.enableProductCatalog,
      enableCheckout: settings.enableCheckout,
      enableLoyalty: settings.enableLoyalty,
      enableCashback: settings.enableCashback,
      enableReferrals: settings.enableReferrals,
      allowWaitlist: settings.allowWaitlist,
    });
  }, [settings]);

  const updateDraft = <K extends keyof SettingsDraft>(field: K, value: SettingsDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const submitSettings = () => {
    const payload = buildSettingsPayload(draft);
    if (!payload) {
      setFeedback('Informe nome da barbearia e prazos válidos.');
      return;
    }

    updateSettings.mutate(payload, {
      onSuccess: () => setFeedback('Perfil do Artur salvo.'),
      onError: (mutationError) =>
        setFeedback(
          mutationError instanceof Error
            ? mutationError.message
            : 'Não foi possível salvar o perfil.',
        ),
    });
  };

  const errorMessage =
    error instanceof Error ? error.message : 'Não foi possível carregar o perfil do Artur.';

  return (
    <AuthGuard requireAdmin>
      <>
        <Head>
          <title>Perfil do Artur - Barbearia do Artur</title>
          <meta name="description" content="Configurações da Barbearia do Artur" />
        </Head>

        <Layout title="Perfil do Artur">
          <Container maxWidth="xl">
            <Box
              display="flex"
              justifyContent="space-between"
              gap={2}
              alignItems={{ xs: 'stretch', md: 'center' }}
              flexDirection={{ xs: 'column', md: 'row' }}
              mb={4}
            >
              <Box>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                  Perfil do Artur
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Dados que alimentam a operação, a lojinha e a experiência do cliente.
                </Typography>
              </Box>
              <Button
                variant="primary"
                startIcon={<SaveIcon />}
                onClick={submitSettings}
                disabled={isLoading || updateSettings.isLoading}
              >
                {updateSettings.isLoading ? 'Salvando...' : 'Salvar perfil'}
              </Button>
            </Box>

            {feedback ? (
              <Alert
                severity={feedback.includes('salvo') ? 'success' : 'error'}
                onClose={() => setFeedback(null)}
                sx={{ mb: 3 }}
              >
                {feedback}
              </Alert>
            ) : null}

            {error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            ) : null}

            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} lg={3}>
                <SettingsShortcutCard
                  icon={<BusinessIcon color="primary" />}
                  title="Dados"
                  subtitle={draft.salonName || 'Barbearia'}
                  targetId="business-settings"
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <SettingsShortcutCard
                  icon={<StorefrontIcon color="primary" />}
                  title="Operação"
                  subtitle={draft.enableProductCatalog ? 'Lojinha ativa' : 'Lojinha inativa'}
                  targetId="operation-settings"
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <SettingsShortcutCard
                  icon={<WorkspacePremiumIcon color="primary" />}
                  title="Pontos"
                  subtitle={draft.enableLoyalty ? 'Pontos ativos' : 'Pontos inativos'}
                  targetId="loyalty-settings"
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <SettingsShortcutCard
                  icon={<AccountBalanceWalletIcon color="primary" />}
                  title="Cashback"
                  subtitle={draft.enableCashback ? 'Cashback ativo' : 'Cashback inativo'}
                  targetId="loyalty-settings"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2.5}>
              <Grid item xs={12} lg={8}>
                <Card
                  id="business-settings"
                  title="Dados da barbearia"
                  subtitle="Informações de contato e apresentação"
                  density="compact"
                  sx={{ scrollMarginTop: 24 }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        required
                        label="Nome da barbearia"
                        value={draft.salonName}
                        onChange={(event) => updateDraft('salonName', event.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Razão social"
                        value={draft.legalName}
                        onChange={(event) => updateDraft('legalName', event.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Descrição"
                        value={draft.description}
                        onChange={(event) => updateDraft('description', event.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Telefone"
                        value={draft.phone}
                        onChange={(event) => updateDraft('phone', event.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="WhatsApp"
                        value={draft.whatsapp}
                        onChange={(event) => updateDraft('whatsapp', event.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={draft.email}
                        onChange={(event) => updateDraft('email', event.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card
                  id="operation-settings"
                  title="Operação"
                  subtitle="Regras simples para agenda e módulos"
                  density="compact"
                  action={<StorefrontIcon color="primary" />}
                  sx={{ scrollMarginTop: 24 }}
                >
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Antecedência mínima em minutos"
                      value={draft.appointmentLeadTimeMinutes}
                      onChange={(event) =>
                        updateDraft('appointmentLeadTimeMinutes', event.target.value)
                      }
                      inputProps={{ inputMode: 'numeric' }}
                    />
                    <TextField
                      fullWidth
                      label="Janela de cancelamento em horas"
                      value={draft.cancellationWindowHours}
                      onChange={(event) =>
                        updateDraft('cancellationWindowHours', event.target.value)
                      }
                      inputProps={{ inputMode: 'numeric' }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={draft.enableProductCatalog}
                          onChange={(event) =>
                            updateDraft('enableProductCatalog', event.target.checked)
                          }
                        />
                      }
                      label="Lojinha ativa"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={draft.enableCheckout}
                          onChange={(event) =>
                            updateDraft('enableCheckout', event.target.checked)
                          }
                        />
                      }
                      label="Checkout ativo"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={draft.allowWaitlist}
                          onChange={(event) =>
                            updateDraft('allowWaitlist', event.target.checked)
                          }
                        />
                      }
                      label="Lista de espera ativa"
                    />
                  </Stack>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card
                  id="loyalty-settings"
                  title="Pontos e cashback"
                  subtitle="Controle do relacionamento com clientes"
                  density="compact"
                  action={<WorkspacePremiumIcon color="primary" />}
                  sx={{ scrollMarginTop: 24 }}
                >
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={draft.enableLoyalty}
                          onChange={(event) =>
                            updateDraft('enableLoyalty', event.target.checked)
                          }
                        />
                      }
                      label="Pontos ativos"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={draft.enableCashback}
                          onChange={(event) =>
                            updateDraft('enableCashback', event.target.checked)
                          }
                        />
                      }
                      label="Cashback ativo"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={draft.enableReferrals}
                          onChange={(event) =>
                            updateDraft('enableReferrals', event.target.checked)
                          }
                        />
                      }
                      label="Indicações ativas"
                    />
                  </Stack>
                </Card>
              </Grid>

              <Grid item xs={12} lg={8}>
                <Card
                  id="social-settings"
                  title="Redes sociais"
                  subtitle="Canais públicos"
                  density="compact"
                  sx={{ scrollMarginTop: 24 }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Instagram"
                        value={draft.instagram}
                        onChange={(event) => updateDraft('instagram', event.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Facebook"
                        value={draft.facebook}
                        onChange={(event) => updateDraft('facebook', event.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="TikTok"
                        value={draft.tiktok}
                        onChange={(event) => updateDraft('tiktok', event.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Layout>
      </>
    </AuthGuard>
  );
};

function buildSettingsPayload(form: SettingsDraft): SalonSettingsPayload | null {
  const appointmentLeadTimeMinutes = parseInteger(form.appointmentLeadTimeMinutes);
  const cancellationWindowHours = parseInteger(form.cancellationWindowHours);

  if (!form.salonName.trim() || appointmentLeadTimeMinutes == null || cancellationWindowHours == null) {
    return null;
  }

  return {
    salonName: form.salonName.trim(),
    legalName: form.legalName.trim() || undefined,
    description: form.description.trim() || undefined,
    phone: form.phone.trim() || undefined,
    whatsapp: form.whatsapp.trim() || undefined,
    email: form.email.trim() || undefined,
    instagram: form.instagram.trim() || undefined,
    facebook: form.facebook.trim() || undefined,
    tiktok: form.tiktok.trim() || undefined,
    appointmentLeadTimeMinutes,
    cancellationWindowHours,
    enableProductCatalog: form.enableProductCatalog,
    enableCheckout: form.enableCheckout,
    enableLoyalty: form.enableLoyalty,
    enableCashback: form.enableCashback,
    enableReferrals: form.enableReferrals,
    allowWaitlist: form.allowWaitlist,
  };
}

function parseInteger(value: string) {
  const numberValue = Number(value.trim());
  return Number.isInteger(numberValue) && numberValue >= 0 ? numberValue : null;
}

function SettingsShortcutCard({
  icon,
  title,
  subtitle,
  targetId,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  targetId: string;
}) {
  const activate = () => scrollToSection(targetId);

  return (
    <Card
      hover
      density="compact"
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      }}
      role="button"
      tabIndex={0}
      sx={{
        minHeight: 148,
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      <Stack spacing={1.25}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'action.hover',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={800}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default SettingsPage;
