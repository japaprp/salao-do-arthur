# Guia Atual do Backend

Estado atual da API:

- NestJS + Prisma + MySQL
- execução local sem Docker
- banco local no XAMPP
- porta padrão `3100`
- autenticação com `accessToken` + `refreshToken`
- rotação de refresh token
- logout revogando sessões no banco
- NestJS é a única fonte de verdade do sistema

## Setup local

```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npm run prisma:seed
npm run type-check
npm run build
npm run start:dev
```

## Endpoints principais

- health: `GET /api/health`
- login: `POST /api/auth/login`
- cadastro público de cliente: `POST /api/auth/register`
- onboarding admin/tenant: `POST /api/auth/register/admin`
- refresh: `POST /api/auth/refresh`
- logout: `POST /api/auth/logout`
- relatórios consolidados: `GET /api/reports/overview`

## Smoke local

```powershell
cd backend
$env:SMOKE_API_URL="http://127.0.0.1:3100/api"
npm run smoke:client-flow
```

## Validação mínima

```bash
npm run type-check
npm run build
npm run test -- --runInBand auth.service.spec.ts professionals.service.spec.ts reports.service.spec.ts
```

## Observação

Produção não deve usar `prisma db push` como rotina operacional. Use migrations controladas.
