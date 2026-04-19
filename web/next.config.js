const buildId = (process.env.APP_BUILD_ID || process.env.GITHUB_SHA || 'local-build').slice(0, 32);
const standaloneEnabled =
  process.env.NEXT_STANDALONE === 'true' || process.env.NODE_ENV === 'production';

const nextConfig = {
  experimental: {
    appDir: true,
  },
  generateBuildId: async () => buildId,
  ...(standaloneEnabled && {
    output: 'standalone',
  }),
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // ✅ TypeScript: Verificar erros em produção
  typescript: {
    ignoreBuildErrors: false, // CRÍTICO: Sempre verificar em build
  },
  // ✅ ESLint: Sempre executar durante build
  eslint: {
    ignoreDuringBuilds: false, // CRÍTICO: Sempre verificar em build
    dirs: ['src'], // Apenas verificar src
  },
};

module.exports = nextConfig;
