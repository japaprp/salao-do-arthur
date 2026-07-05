const buildId = (process.env.APP_BUILD_ID || process.env.GITHUB_SHA || 'local-build').slice(0, 32);
const githubPagesEnabled = process.env.GITHUB_PAGES === 'true';
const staticExportEnabled = process.env.NEXT_OUTPUT === 'export' || githubPagesEnabled;
const standaloneEnabled =
  !staticExportEnabled &&
  (process.env.NEXT_STANDALONE === 'true' || process.env.NODE_ENV === 'production');
const siteBasePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH || '';

const nextConfig = {
  generateBuildId: async () => buildId,
  ...(staticExportEnabled && {
    output: 'export',
    trailingSlash: true,
  }),
  ...(standaloneEnabled && {
    output: 'standalone',
  }),
  ...(siteBasePath && {
    basePath: siteBasePath,
    assetPrefix: siteBasePath,
  }),
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: staticExportEnabled || process.env.NODE_ENV === 'development',
  },
  // TypeScript: verificar erros em produção.
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
