import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Alert, Box, Container, Link, Paper, Stack, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AuthGuard } from '@/components/auth/AuthGuard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import { api } from '@/lib/api/client';

type ResetPasswordForm = {
  token: string;
  password: string;
  confirmPassword: string;
};

const resetPasswordSchema = yup.object({
  token: yup.string().trim().required('Link inválido: token ausente'),
  password: yup
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .required('Senha é obrigatória'),
  confirmPassword: yup
    .string()
    .required('Confirme a senha')
    .oneOf([yup.ref('password')], 'As senhas precisam ser iguais'),
});

const ResetPasswordPage: NextPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: yupResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const token = typeof router.query.token === 'string' ? router.query.token : '';
    if (token) {
      setValue('token', token);
    }
  }, [router.query.token, setValue]);

  const onSubmit = async ({ token, password }: ResetPasswordForm) => {
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await api.post<{ message: string }>('/auth/reset-password', {
        token,
        password,
      });
      setMessage(response.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível trocar a senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard requireAuth={false}>
      <>
        <Head>
          <title>Nova senha - Barbearia do Artur</title>
          <meta name="description" content="Criar nova senha da Barbearia do Artur" />
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
                Criar nova senha
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Escolha uma senha forte. Depois disso, sessões antigas são derrubadas para proteger
                a agenda e os clientes.
              </Typography>

              {message ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {message}
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
                    label="Token do link"
                    {...register('token')}
                    error={!!errors.token}
                    helperText={errors.token?.message}
                  />
                  <Input
                    required
                    fullWidth
                    label="Nova senha"
                    type="password"
                    {...register('password')}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                  />
                  <Input
                    required
                    fullWidth
                    label="Confirmar nova senha"
                    type="password"
                    {...register('confirmPassword')}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                  />
                </Stack>

                <Button
                  type="submit"
                  fullWidth
                  variant="primary"
                  size="large"
                  disabled={isSubmitting || Boolean(message)}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {isSubmitting ? <Loading size="small" /> : 'Trocar senha'}
                </Button>

                <Link component={NextLink} href="/auth/login" variant="body2">
                  Voltar para o login
                </Link>
              </Box>
            </Paper>
          </Box>
        </Container>
      </>
    </AuthGuard>
  );
};

export default ResetPasswordPage;
