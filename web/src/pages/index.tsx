import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { AuthGuard } from '@/components/auth/AuthGuard';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Salão da Lu - Painel Administrativo</title>
        <meta name="description" content="Sistema de gestão para salões de beleza" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AuthGuard requireAuth={false} redirectTo="/dashboard">
        <div />
      </AuthGuard>
    </>
  );
};

export default Home;
