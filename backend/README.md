# Backend Barbearia do Artur

API NestJS modular da Barbearia do Artur, preparada para agenda, clientes, serviços, lojinha, pacotes e rotina do Artur.

## Estrutura

- `src/` código principal da aplicação
- `src/modules/` módulos de domínio
- `prisma/` schema Prisma e seed mínima
- `scripts/` smoke flows locais

## Tecnologias

- NestJS
- Prisma
- MySQL
- JWT

## Execução local

Este projeto roda localmente sem Docker, usando MySQL do XAMPP.

1. iniciar o `MySQL` no XAMPP
2. criar o banco `barbearia_dev`
3. aplicar o schema do Prisma
4. popular a seed mínima
5. subir a API local

```powershell
cd backend
npx prisma db push
npm run prisma:seed
npm run start:dev
```

Para habilitar Swagger localmente:

```powershell
$env:ENABLE_SWAGGER="true"
npm run start:dev
```

Em outro terminal:

```powershell
cd backend
$env:SMOKE_API_URL="http://127.0.0.1:3100/api"
npm run smoke:client-flow
```

Credenciais seeded:

- cliente: `cliente.demo@barbeariadoartur.app / Cliente123!`
- Artur gestor: `artur@barbeariadoartur.app / Gestora123!`

## Endpoints úteis

- API local: `http://localhost:3100/api`
- relatórios consolidados: `GET /api/reports/overview`
- onboarding admin: `POST /api/auth/register/admin`

## Observação importante

O `schema.prisma` é a fonte de verdade para o banco local. Se houver divergência com `database/schema.sql`, priorize o Prisma para desenvolvimento.
