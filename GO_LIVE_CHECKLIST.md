# Go-live checklist - Salao do Arthur

Repositorio correto:

- https://github.com/japaprp/salao-do-arthur

## O que ja esta preparado

- Backend NestJS com Prisma/MySQL, auth, RBAC, agenda, lojinha e Mercado Pago preparado.
- Web Next.js pronta para GitHub Pages via `.github/workflows/pages.yml`.
- API pronta para Render Free via `render.yaml`.
- Banco MySQL deve ser externo para evitar cobranca de disco/private service no Render.
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

O Blueprint cria apenas:

```text
salao-do-arthur-api
```

Para nao pagar Render agora, use MySQL externo. Opcao indicada:

```text
Aiven for MySQL Free
```

O Aiven tem plano MySQL gratuito para projeto pequeno, sem cartao, com 1 GB de armazenamento.
Depois que criar o MySQL no Aiven, copie a connection string e configure no Render:

```text
DATABASE_URL=mysql://USUARIO:SENHA@HOST:PORTA/defaultdb?ssl-mode=REQUIRED
```

Segredos gerados automaticamente pelo Render:

```text
JWT_SECRET
REFRESH_TOKEN_SECRET
PASSWORD_RESET_SECRET
```

O primeiro deploy executa seed inicial para criar o Artur:

```text
artur@barbeariadoartur.app / Gestora123!
```

## Mercado Pago

No `render.yaml` essas variaveis entram vazias para nao bloquear o primeiro deploy.
Pode ficar assim enquanto a conta real nao estiver pronta:

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

1. Criar MySQL gratuito no Aiven.
2. Copiar a connection string MySQL.
3. Abrir o Blueprint do Render usando o repo `https://github.com/japaprp/salao-do-arthur`.
4. Preencher `DATABASE_URL` com a connection string do Aiven.
5. Aplicar o Blueprint no Render.
6. Esperar `/api/health/ready` responder 200.
7. Configurar `NEXT_PUBLIC_API_URL` no GitHub repo.
8. Ativar GitHub Pages como GitHub Actions.
9. Rodar workflow `Deploy Web to GitHub Pages`.
10. Testar login do Artur na URL publica.
11. Depois cadastrar Mercado Pago real.
