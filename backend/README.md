# Backend Salão da Lu

API NestJS modular do Salão da Lu, preparada para multi-tenant, autenticação por salão e fluxo cliente de agendamento.

## Estrutura

- `src/` código principal da aplicação
- `src/modules/` módulos de domínio
- `prisma/` schema Prisma e seed mínima
- `scripts/` smoke flows locais
- `docker-compose.smoke.yml` Postgres temporário para validação real do backend

## Tecnologias

- NestJS
- Prisma
- PostgreSQL
- JWT

## Smoke local isolado

Este fluxo valida auth, perfil do cliente, serviços, slots disponíveis e reserva sem depender do banco principal do projeto.

1. subir o Postgres temporário
2. aplicar o schema do Prisma
3. popular a seed mínima
4. subir a API apontando para esse banco
5. rodar o smoke flow HTTP

Exemplo:

```bash
docker compose -f backend/docker-compose.smoke.yml up -d
cd backend
$env:DATABASE_URL="postgresql://salao:salao@127.0.0.1:55432/salao_smoke?schema=public"
$env:JWT_SECRET="smoke-secret"
$env:BACKEND_PORT="3100"
npx prisma db push
npm run prisma:seed
npm run start:dev
```

Em outro terminal:

```bash
cd backend
$env:SMOKE_API_URL="http://127.0.0.1:3100/api"
npm run smoke:client-flow
```

Credenciais seeded:

- cliente: `cliente.demo@salaodaluu.app / Cliente123!`
- gestora: `gestora.demo@salaodaluu.app / Gestora123!`

## Observação importante

O smoke local usa o `schema.prisma` como fonte de verdade para um banco temporário. Isso é proposital porque ainda existe drift entre `database/schema.sql` e o schema Prisma, então a validação local de runtime não deve ser feita em cima do SQL legado até essa unificação acontecer.
