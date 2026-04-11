# 🚀 QUICK START - Deploy em 5 Minutos

## Railway: A Forma Mais Rápida

### Passo 1: Preparar (1 min)
```bash
# Copie o arquivo de exemplo e configure as senhas
cp .env.example .env.local

# Edite .env.local com senhas fortes:
# DB_PASSWORD=sua_senha_muito_segura_123
# JWT_SECRET=sua_chave_jwt_segura_456
```

### Passo 2: Push para GitHub (1 min)
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### Passo 3: Railway Setup (3 min)

1. Acesse: https://railway.app
2. Clique: "New Project"
3. Selecione: "Deploy from GitHub"
4. Conecte sua conta GitHub
5. Escolha este repo: `salao`
6. Railway detecta automaticamente!
7. Clique: "Deploy"

### Passo 4: Configurar Variáveis (No Dashboard Railway)
Na seção "Variables", adicione:
```
DB_PASSWORD=sua_senha_muito_segura_123
JWT_SECRET=sua_chave_jwt_segura_456
POSTGRES_PASSWORD=sua_senha_muito_segura_123
NODE_ENV=production
```

### Pronto! ✅
Railway sobe automaticamente:
- ✅ PostgreSQL Database
- ✅ Redis Cache
- ✅ Backend NestJS
- ✅ Frontend Next.js

Suas URLs públicas aparecerão no dashboard!

---

## Se quiser em Vercel (Frontend Only)

```bash
# 1. Push para GitHub (já fez)

# 2. Acesse: https://vercel.com
# 3. "Import Project" → GitHub repo
# 4. Escolha pasta: ./web
# 5. Deploy automático!

# Frontend URL: https://seu-projeto.vercel.app
```

---

## Variáveis de Produção Recomendadas

```env
# Security
JWT_SECRET=gerar-chave-forte-aqui-min-32-chars
DB_PASSWORD=gerar-senha-forte-aqui-min-16-chars
POSTGRES_PASSWORD=mesma-senha-do-db

# Environment
NODE_ENV=production
DATABASE_URL=postgresql://salao:DB_PASSWORD@postgres:5432/salao_da_lu?schema=public

# Database
DB_NAME=salao_da_lu
DB_USER=salao

# Application
JWT_EXPIRES_IN=2h
PORT=3000

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Frontend
NEXT_PUBLIC_API_URL=https://seu-backend.up.railway.app/api
NEXT_PUBLIC_APP_URL=https://seu-frontend.up.railway.app
```

---

## Comandos Úteis Depois do Deploy

```bash
# Ver logs do Railway
railway logs

# Conectar ao banco remoto
railway run psql -h postgres -U salao -d salao_da_lu

# Reiniciar aplicação
railway restart

# Ver status
railway status
```

---

## ⚠️ Importante!

- **NÃO COMMITAR** `.env` no GitHub
- Usar sempre Railway Variables para secrets
- Ativar backups automáticos no dashboard
- Monitorar memory/CPU usage
- Configurar domain customizado depois

---

## 💰 Custo Expect

- Starter Plan: **$5/mês**
- Inclui: Backend + Frontend + Database + Redis
- Escalável conforme crescimento

---

**Precisa de ajuda?** Consulte: [CLOUD_DEPLOYMENT.md](./CLOUD_DEPLOYMENT.md) para guia completo!
