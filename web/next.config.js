const buildId = (process.env.APP_BUILD_ID || process.env.GITHUB_SHA || 'local-build').slice(0, 32);
const standaloneEnabled =
  process.env.NEXT_STANDALONE === 'true' || process.env.NODE_ENV === 'production';

const nextConfig = {
  generateBuildId: async () => buildId,
  ...(standaloneEnabled && {
    output: 'standalone',
  }),
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // TypeScript: verificar erros em produção.
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
