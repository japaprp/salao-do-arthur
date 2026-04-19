import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import {
  Alert,
  Box,
  Container,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AuthGuard } from '@/components/auth/AuthGuard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import { useAuth } from '@/hooks/useAuth';
import { AdminRegisterForm } from '@/types';

const registerSchema = yup.object({
  organizationName: yup.string().trim().required('Nome do salao e obrigatorio'),
  name: yup.string().trim().required('Nome e obrigatorio'),
  email: yup.string().trim().email('Email invalido').required('Email e obrigatorio'),
  password: yup
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .required('Senha e obrigatoria'),
  confirmPassword: yup
    .string()
    .required('Confirme a senha')
    .oneOf([yup.ref('password')], 'As senhas precisam ser iguais'),
});

const RegisterPage: NextPage = () => {
  const { register: registerUser, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminRegisterForm>({
    resolver: yupResolver(registerSchema),
  });

  const onSubmit = async (data: AdminRegisterForm) => {
    setError(null);

    try {
      await registerUser({
        organizationName: data.organizationName,
        name: data.name,
        email: data.email,
        password: data.password,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    }
  };

  return (
    <AuthGuard requireAuth={false}>
      <>
        <Head>
          <title>Cadastro - Salão da Lu</title>
          <meta name="description" content="Cadastro de acesso ao Salão da Lu" />
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
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                borderRadius: 2,
              }}
            >
              <Typography component="h1" variant="h4" fontWeight={600} gutterBottom>
                Criar salão
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Criação inicial da conta gestora e do tenant do salão.
              </Typography>

              {error ? (
                <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                  {error}
                </Alert>
              ) : null}

              <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
                <Stack spacing={1.5}>
                  <Input
                    required
                    fullWidth
                    label="Nome do salao"
                    placeholder="Salao da Lu"
                    {...register('organizationName')}
                    error={!!errors.organizationName}
                    helperText={errors.organizationName?.message}
                  />
                  <Input
                    required
                    fullWidth
                    label="Nome"
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                  <Input
                    required
                    fullWidth
                    label="Email"
                    type="email"
                    {...register('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                  <Input
                    required
                    fullWidth
                    label="Senha"
                    type="password"
                    {...register('password')}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                  />
                  <Input
                    required
                    fullWidth
                    label="Confirmar senha"
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
                  disabled={isLoading}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {isLoading ? <Loading size="small" /> : 'Criar conta'}
                </Button>

                <Link component={NextLink} href="/auth/login" variant="body2">
                  Ja tem conta? Entrar
                </Link>
              </Box>
            </Paper>
          </Box>
        </Container>
      </>
    </AuthGuard>
  );
};

export default RegisterPage;
