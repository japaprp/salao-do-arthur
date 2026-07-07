import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import {
  Alert,
  Box,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/EmailOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';
import CalendarIcon from '@mui/icons-material/CalendarMonthOutlined';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AuthGuard } from '@/components/auth/AuthGuard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import { useAuth } from '@/hooks/useAuth';

type ArturLoginForm = {
  arturLoginEmail: string;
  arturLoginPassword: string;
};

const loginSchema = yup.object().shape({
  arturLoginEmail: yup
    .string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  arturLoginPassword: yup
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .required('Senha é obrigatória'),
});

const darkInputSx = {
  '& .MuiInputLabel-root': {
    color: 'rgba(255,255,255,0.58)',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#D8A847',
  },
  '& .MuiOutlinedInput-root': {
    color: '#FFFFFF',
    bgcolor: 'rgba(255,255,255,0.035)',
    '& fieldset': {
      borderColor: 'rgba(216,168,71,0.35)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(216,168,71,0.72)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#D8A847',
    },
  },
  '& .MuiSvgIcon-root': {
    color: '#D8A847',
  },
  '& .MuiFormHelperText-root': {
    mx: 0,
  },
};

const Login: NextPage = () => {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ArturLoginForm>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      arturLoginEmail: '',
      arturLoginPassword: '',
    },
  });

  const onSubmit = async (data: ArturLoginForm) => {
    setError(null);

    try {
      await login(data.arturLoginEmail.trim(), data.arturLoginPassword);
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

        <Box
          component="main"
          sx={{
            minHeight: '100vh',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            bgcolor: '#050505',
            color: '#fff',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              minHeight: { xs: 390, md: '100vh' },
              px: { xs: 3, sm: 5, md: 8 },
              py: { xs: 4, md: 7 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background:
                'radial-gradient(circle at 78% 18%, rgba(219,166,62,0.24), transparent 28%), linear-gradient(135deg, rgba(5,5,5,0.94), rgba(5,5,5,0.72)), linear-gradient(120deg, #050505, #18100a 52%, #050505)',
              '&:after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                opacity: 0.16,
                backgroundImage:
                  'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '42px 42px',
                pointerEvents: 'none',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 68,
                    height: 68,
                    borderRadius: '50%',
                    border: '2px solid #D8A847',
                    color: '#D8A847',
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: 'serif',
                    fontSize: 42,
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  A
                </Box>
                <Box>
                  <Typography
                    fontFamily="serif"
                    fontWeight={800}
                    sx={{ fontSize: { xs: 25, md: 31 }, letterSpacing: 0 }}
                  >
                    BARBEARIA
                  </Typography>
                  <Typography
                    fontFamily="serif"
                    fontWeight={800}
                    color="#D8A847"
                    sx={{ fontSize: { xs: 18, md: 22 }, letterSpacing: 4, mt: -0.8 }}
                  >
                    DO ARTUR
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 620, py: { xs: 5, md: 0 } }}>
              <Typography
                sx={{
                  color: '#D8A847',
                  letterSpacing: 7,
                  fontSize: 14,
                  fontWeight: 700,
                  mb: 2.5,
                }}
              >
                ESTILO • CONFIANÇA • ATITUDE
              </Typography>
              <Typography
                component="h1"
                fontFamily="serif"
                fontWeight={900}
                sx={{
                  fontSize: { xs: 52, sm: 70, md: 90 },
                  lineHeight: 0.86,
                  letterSpacing: 0,
                }}
              >
                BARBEARIA
                <Box component="span" display="block" color="#D8A847">
                  DO ARTUR
                </Box>
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ my: 3 }}>
                <Box sx={{ height: 1, flex: 1, maxWidth: 190, bgcolor: '#D8A847' }} />
                <ContentCutIcon sx={{ color: '#D8A847' }} />
                <Box sx={{ height: 1, flex: 1, maxWidth: 190, bgcolor: '#D8A847' }} />
              </Stack>
              <Typography sx={{ color: 'rgba(255,255,255,0.78)', fontSize: 20, lineHeight: 1.55 }}>
                Mais que um corte, uma experiência. Seu estilo, do seu jeito.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2.5}
              sx={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.88)' }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <CalendarIcon sx={{ color: '#D8A847' }} />
                <Typography fontWeight={700}>Agenda simples</Typography>
              </Stack>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <ContentCutIcon sx={{ color: '#D8A847' }} />
                <Typography fontWeight={700}>Serviços e clientes</Typography>
              </Stack>
            </Stack>
          </Box>

          <Box
            sx={{
              px: { xs: 2.5, sm: 5, md: 7 },
              py: { xs: 4, md: 7 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'linear-gradient(180deg, rgba(5,5,5,0.94), rgba(15,12,8,0.98))',
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 560,
                p: { xs: 2.5, sm: 4 },
                borderRadius: 3,
                border: '1px solid rgba(216,168,71,0.55)',
                background:
                  'linear-gradient(145deg, rgba(20,18,15,0.94), rgba(8,8,8,0.92))',
                boxShadow: '0 28px 80px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Typography
                component="h2"
                fontWeight={900}
                color="#D8A847"
                sx={{ fontSize: { xs: 29, sm: 34 }, mb: 1 }}
              >
                Bem-vindo!
              </Typography>
              <Typography
                textAlign="center"
                sx={{ color: 'rgba(255,255,255,0.78)', mb: 3, fontSize: 16 }}
              >
                Entre com email e senha do Artur para acessar agenda, clientes e lojinha.
              </Typography>

              {error ? (
                <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                  {error}
                </Alert>
              ) : null}

              <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                autoComplete="off"
                sx={{ mt: 1, width: '100%' }}
              >
                <Input
                  margin="normal"
                  required
                  fullWidth
                  id="artur-login-email"
                  label="Email"
                  autoComplete="off"
                  autoFocus
                  placeholder="artur@barbeariadoartur.app"
                  startIcon={<EmailIcon />}
                  sx={darkInputSx}
                  inputProps={{
                    autoComplete: 'off',
                    'data-lpignore': 'true',
                    'data-1p-ignore': 'true',
                  }}
                  {...register('arturLoginEmail')}
                  error={!!errors.arturLoginEmail}
                  helperText={errors.arturLoginEmail?.message}
                />

                <Input
                  margin="normal"
                  required
                  fullWidth
                  label="Senha"
                  type="password"
                  id="artur-login-password"
                  autoComplete="new-password"
                  startIcon={<LockIcon />}
                  sx={darkInputSx}
                  inputProps={{
                    autoComplete: 'new-password',
                    'data-lpignore': 'true',
                    'data-1p-ignore': 'true',
                  }}
                  {...register('arturLoginPassword')}
                  error={!!errors.arturLoginPassword}
                  helperText={errors.arturLoginPassword?.message}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="primary"
                  size="large"
                  disabled={isLoading}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.45,
                    bgcolor: '#D8A847',
                    color: '#120D06',
                    fontWeight: 900,
                    '&:hover': {
                      bgcolor: '#E5BB61',
                    },
                  }}
                >
                  {isLoading ? <Loading size="small" /> : 'Entrar'}
                </Button>

                <Box display="flex" justifyContent="center">
                  <Link
                    component={NextLink}
                    href="/auth/forgot-password"
                    variant="body2"
                    sx={{ color: '#D8A847' }}
                  >
                    Esqueceu a senha?
                  </Link>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </>
    </AuthGuard>
  );
};

export default Login;
