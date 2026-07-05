import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import { Alert, Box, Container, Link, Paper, Stack, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AuthGuard } from '@/components/auth/AuthGuard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import { api } from '@/lib/api/client';
import { DEFAULT_TENANT_SUBDOMAIN } from '@/lib/auth/tenant';

type ForgotPasswordForm = {
  email: string;
};

type ForgotPasswordResponse = {
  message: string;
  resetUrl?: string;
};

const forgotPasswordSchema = yup.object({
  email: yup.string().trim().email('Email inválido').required('Email é obrigatório'),
});

const ForgotPasswordPage: NextPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsSubmitting(true);
    setMessage(null);
    setDevResetUrl(null);
    setError(null);

    try {
      const response = await api.post<ForgotPasswordResponse>('/auth/forgot-password', {
        tenantSubdomain: DEFAULT_TENANT_SUBDOMAIN,
        email: data.email,
      });
      setMessage(response.message);
      setDevResetUrl(response.resetUrl ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível pedir o link agora.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard requireAuth={false}>
      <>
        <Head>
          <title>Esqueci minha senha - Barbearia do Artur</title>
          <meta
            name="description"
            content="Recuperação de senha do painel da Barbearia do Artur"
          />
        </Head>

        <Container component="main" maxWidth="sm">
          <Box
            sx={{
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Paper
              elevation={3}
              sx={{
                padding: 4,
                width: '100%',
                borderRadius: 2,
              }}
            >
              <Typography component="h1" variant="h4" fontWeight={700} gutterBottom>
                Esqueceu a senha?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Informe o email do Artur. O sistema envia um caminho seguro para voltar ao painel.
              </Typography>

              {message ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {message}
                </Alert>
              ) : null}
              {devResetUrl ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Ambiente local: <Link href={devResetUrl}>abrir link de redefinição</Link>
                </Alert>
              ) : null}
              {error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              ) : null}

              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={1.5}>
                  <Input
                    required
                    fullWidth
                    label="Email"
                    type="email"
                    placeholder="artur@barbeariadoartur.app"
                    {...register('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                </Stack>

                <Button
                  type="submit"
                  fullWidth
                  variant="primary"
                  size="large"
                  disabled={isSubmitting}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {isSubmitting ? <Loading size="small" /> : 'Enviar link seguro'}
                </Button>

                <Link component={NextLink} href="/auth/login" variant="body2">
                  Lembrei a senha
                </Link>
              </Box>
            </Paper>
          </Box>
        </Container>
      </>
    </AuthGuard>
  );
};

export default ForgotPasswordPage;
