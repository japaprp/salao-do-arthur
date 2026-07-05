# Go-live checklist - Salao do Arthur

Repositorio correto:

- https://github.com/japaprp/salao-do-arthur

## O que ja esta preparado

- Backend NestJS com Prisma/MySQL, auth, RBAC, agenda, lojinha e Mercado Pago preparado.
- Web Next.js pronta para GitHub Pages via `.github/workflows/pages.yml`.
- API pronta para Render via `render.yaml`.
- Login do Artur sem codigo de barbearia.
- Tenant padrao: `barbearia-do-artur`.

## GitHub Pages

URL esperada da web:

```text
https://japaprp.github.io/salao-do-arthur/
```

Antes de publicar Pages, configure no GitHub:

1. `Settings > Pages > Source > GitHub Actions`.
2. `Settings > Secrets and variables > Actions > Variables`.
3. Criar a variable:

```text
NEXT_PUBLIC_API_URL=https://URL_PUBLICA_DA_API/api
```

O workflow falha de proposito se `NEXT_PUBLIC_API_URL` estiver vazio ou apontar para `localhost`.
Isso evita publicar uma web que abre, mas nao consegue fazer login.

## Backend real

Opcao pronta no repo:

```text
render.yaml
```

No Render, criar Blueprint usando:

```text
https://github.com/japaprp/salao-do-arthur
```

Variaveis obrigatorias no Render:

```text
DATABASE_URL=mysql://USUARIO:SENHA@HOST:3306/BANCO
JWT_SECRET=gerar_valor_longo_e_aleatorio
REFRESH_TOKEN_SECRET=gerar_outro_valor_longo_e_aleatorio
PASSWORD_RESET_SECRET=gerar_outro_valor_longo_e_aleatorio
```

Render nao cria MySQL gerenciado nesse Blueprint. Use um MySQL externo, como Aiven, Railway MySQL, VPS, PlanetScale compativel ou outro provedor MySQL.

## Mercado Pago

Pode ficar vazio enquanto a conta real nao estiver pronta:

```text
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=
MERCADO_PAGO_WEBHOOK_URL=
```

Quando preencher:

1. Configure `MERCADO_PAGO_WEBHOOK_URL` com a URL publica da API:

```text
https://URL_PUBLICA_DA_API/api/payments/webhooks/mercado-pago
```

2. Configure o webhook na conta Mercado Pago.
3. Rode um checkout de teste antes de ativar venda real.

## Sequencia correta para ficar real

1. Criar MySQL de producao.
2. Criar API no Render pelo `render.yaml`.
3. Preencher secrets no Render.
4. Esperar `/api/health/ready` responder 200.
5. Configurar `NEXT_PUBLIC_API_URL` no GitHub repo.
6. Ativar GitHub Pages como GitHub Actions.
7. Rodar workflow `Deploy Web to GitHub Pages`.
8. Testar login do Artur na URL publica.
9. Depois cadastrar Mercado Pago real.
