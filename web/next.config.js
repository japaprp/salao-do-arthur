/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  output: 'standalone',
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3000',
  },
  webpack: (config, { isServer }) => {
    // Configurações adicionais do webpack se necessário
    return config;
  },
  // Configurações para desenvolvimento
  ...(process.env.NODE_ENV === 'development' && {
    rewrites: async () => [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ],
  }),
};

module.exports = nextConfig;