import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import {
  Alert,
  Box,
  Container,
  Grid,
  Link,
  Paper,
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
import { LoginForm } from '@/types';

const loginSchema = yup.object().shape({
  tenantSubdomain: yup
    .string()
    .trim()
    .required('Código da barbearia é obrigatório'),
  email: yup
    .string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  password: yup
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .required('Senha é obrigatória'),
});

const Login: NextPage = () => {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);

    try {
      await login(data.tenantSubdomain, data.email, data.password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    }
  };

  return (
    <AuthGuard requireAuth={false}>
      <>
        <Head>
          <title>Login - Barbearia do Artur</title>
          <meta name="description" content="Login no painel da Barbearia do Artur" />
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
                Barbearia do Artur
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Entre com o código da barbearia, email e senha do Artur.
              </Typography>

              {error ? (
                <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                  {error}
                </Alert>
              ) : null}

              <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                sx={{ mt: 1, width: '100%' }}
              >
                <Input
                  margin="normal"
                  required
                  fullWidth
                  id="tenantSubdomain"
                  label="Código da barbearia"
                  autoComplete="organization"
                  placeholder="barbearia-do-artur"
                  {...register('tenantSubdomain')}
                  error={!!errors.tenantSubdomain}
                  helperText={errors.tenantSubdomain?.message}
                />

                <Input
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  autoComplete="email"
                  autoFocus
                  placeholder="artur@barbeariadoartur.app"
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />

                <Input
                  margin="normal"
                  required
                  fullWidth
                  label="Senha"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  {...register('password')}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="primary"
                  size="large"
                  disabled={isLoading}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {isLoading ? <Loading size="small" /> : 'Entrar'}
                </Button>

                <Grid container>
                  <Grid item xs>
                    <Link component={NextLink} href="/auth/forgot-password" variant="body2">
                      Esqueceu a senha?
                    </Link>
                  </Grid>
                  <Grid item>
                    <Link component={NextLink} href="/auth/register" variant="body2">
                      {'Primeiro acesso? Criar a barbearia'}
                    </Link>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Box>
        </Container>
      </>
    </AuthGuard>
  );
};

export default Login;
