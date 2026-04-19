# Guia Atual do Web

Estado atual do painel web:

- roda em `http://localhost:3001`
- consome somente o backend NestJS em `http://localhost:3100/api`
- não acessa MySQL diretamente
- não expõe `pages/api` como backend paralelo
- usa `accessToken` no cliente e `refreshToken` em cookie `HttpOnly`
- onboarding do salão usa `POST /auth/register/admin`

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

## Fluxos reais

- login admin: `/auth/login`
- onboarding do dono do salão: `/auth/register/admin`
- refresh de sessão: `/auth/refresh`
- logout com invalidação de sessão: `/auth/logout`
- relatórios reais: `/reports/overview`

## Validação mínima

```bash
npm run type-check
npm run build
```

## Observação operacional

Use `localhost` de ponta a ponta no navegador local. Misturar `localhost` com `127.0.0.1` quebra o comportamento esperado do cookie `HttpOnly` de refresh.
