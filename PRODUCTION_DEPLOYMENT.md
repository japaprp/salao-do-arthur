# Production Deployment

Decisão operacional adotada:

- servidor Linux único com `Nginx`
- `backend` NestJS rodando via `systemd` em `127.0.0.1:3100`
- `web` Next.js standalone rodando via `systemd` em `127.0.0.1:3001`
- `MySQL` fora do processo do app, acessado por `DATABASE_URL`
- deploy manual via GitHub Actions com `workflow_dispatch`
- rollback manual via GitHub Actions

## Estrutura esperada no servidor

```text
/var/www/salao
  /shared
    backend.env
    web.env
  /backend
    /releases
    current -> /var/www/salao/backend/releases/<release-id>
  /web
    /releases
    current -> /var/www/salao/web/releases/<release-id>
```

## Pré-requisitos do servidor

```bash
sudo apt update
sudo apt install -y nginx mysql-client curl
```

Node 20 deve estar instalado no servidor e disponível no `PATH` do usuário de deploy.

## Arquivos de ambiente

Crie os arquivos:

- `/var/www/salao/shared/backend.env`
- `/var/www/salao/shared/web.env`

Use como base:

- [backend/.env.production.example](backend/.env.production.example)
- [web/.env.production.example](web/.env.production.example)

## systemd

Copie e ajuste o usuário de execução em:

- [ops/systemd/salao-backend.service](ops/systemd/salao-backend.service)
- [ops/systemd/salao-web.service](ops/systemd/salao-web.service)

Depois:

```bash
sudo cp ops/systemd/salao-backend.service /etc/systemd/system/
sudo cp ops/systemd/salao-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable salao-backend
sudo systemctl enable salao-web
```

## Nginx

Use [ops/nginx/salao.conf](ops/nginx/salao.conf) como base, trocando os domínios placeholder pelos domínios reais.

Depois:

```bash
sudo cp ops/nginx/salao.conf /etc/nginx/sites-available/salao
sudo ln -s /etc/nginx/sites-available/salao /etc/nginx/sites-enabled/salao
sudo nginx -t
sudo systemctl reload nginx
```

Ative TLS com `certbot` antes de abrir o tráfego público.

## GitHub Secrets obrigatórios

No ambiente `production` do GitHub:

- `PRODUCTION_HOST`
- `PRODUCTION_PORT`
- `PRODUCTION_USER`
- `PRODUCTION_SSH_KEY`
- `PRODUCTION_SSH_KNOWN_HOSTS`
- `PRODUCTION_APP_ROOT`

Valor padrão recomendado para `PRODUCTION_APP_ROOT`:

```text
/var/www/salao
```

## Deploy

Workflow:

- [.github/workflows/deploy-production.yml](.github/workflows/deploy-production.yml)

O deploy:

1. empacota `backend` e/ou `web`
2. envia o artefato por `scp`
3. cria nova release no servidor
4. executa `npm ci`
5. backend:
   executa `prisma migrate deploy`, `build` e `npm prune --omit=dev`
6. web:
   executa build standalone com `APP_BUILD_ID`
7. atualiza o symlink `current`
8. reinicia `systemd`
9. valida healthcheck

## Rollback

Workflow:

- [.github/workflows/rollback-production.yml](.github/workflows/rollback-production.yml)

O rollback troca o `current` para a release imediatamente anterior e reinicia o serviço.

## Banco

Produção deve usar:

```bash
npm run prisma:migrate:deploy
```

Não use `prisma db push` em produção.

## Baseline para banco já existente

Se o banco atual foi criado antes do Prisma Migrate e já está com as tabelas prontas, a primeira ação não é `migrate deploy`.

Faça nesta ordem:

```bash
cd backend
npm run prisma:migrate:status
npm run prisma:migrate:baseline:initial
```

Isso deve ser feito uma única vez, depois de backup e validação do schema existente.
