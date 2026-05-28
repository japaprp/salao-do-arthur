import { useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import Loading from '@/components/ui/Loading';
import { useAuth } from '@/hooks/useAuth';

const Home: NextPage = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    void router.replace(isAuthenticated ? '/dashboard' : '/auth/login');
  }, [isAuthenticated, isLoading, router]);

  return (
    <>
      <Head>
        <title>Barbearia do Artur</title>
        <meta
          name="description"
          content="Aplicativo de gestão da Barbearia do Artur para agenda, clientes, profissionais, serviços e lojinha."
        />
      </Head>

      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Loading size="large" />
      </Box>
    </>
  );
};

export default Home;
