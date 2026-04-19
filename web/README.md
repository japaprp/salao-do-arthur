# Painel Web - Salão da Lu

Painel administrativo em Next.js para operação do salão.

## Estado atual

- roda em `http://localhost:3001`
- usa somente a API NestJS em `http://localhost:3100/api`
- não possui backend paralelo no Next.js
- sessão web com `refreshToken` em cookie `HttpOnly`
- dashboard e relatórios usam métricas reais do backend

## Setup local

```bash
cd web
cp .env.example .env.local
npm install
npm run type-check
npm run build
npm run dev
```

## Variáveis de ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:3100/api
API_URL=http://localhost:3100/api
```

## Fluxos

- login: `/auth/login`
- criar salão / conta gestora: `/auth/register`
- dashboard: `/dashboard`
- relatórios reais: `/reports`
- profissionais com vínculo real de serviços: `/professionals`

## Validação

```bash
npm run type-check
npm run build
```
