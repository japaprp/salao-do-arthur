import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

export default [
  {
    ignores: ['.next/**', 'coverage/**', 'node_modules/**', 'next-env.d.ts'],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
];
