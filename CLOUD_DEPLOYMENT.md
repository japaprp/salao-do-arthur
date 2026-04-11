# 🚀 Guia de Deploy em Cloud - Salão da Lu

## Opção 1: Railway.app (⭐ Recomendada - Mais Fácil)

### Vantagens:
- ✅ Deploy automático via GitHub
- ✅ Suporta Docker nativamente
- ✅ Sobe backend, frontend e DB automaticamente
- ✅ Variáveis de ambiente gerenciadas
- ✅ Muito barato ($5/mês starter)
- ✅ 5 minutos para ativar

### Passo a Passo:

1. **Criar conta no Railway**
   - Acesse: https://railway.app
   - Clique em "Start a New Project"
   - Conecte sua conta GitHub

2. **Deploy Automático**
   - Clique em "Deploy from GitHub"
   - Selecione este repositório
   - Railway detecta automaticamente os Dockerfiles
   - Clica em "Deploy"

3. **Configurar Variáveis de Ambiente**
   - Vá para "Variables" no dashboard
   - Adicione as variáveis do `.env.example`:
     ```
     DB_PASSWORD=gerar_senha_forte_aqui
     JWT_SECRET=gerar_chave_jwt_forte_aqui
     POSTGRES_PASSWORD=gerar_senha_forte_aqui
     NODE_ENV=production
     ```

4. **Conectar Serviços**
   - Railway cria automaticamente:
     - Banco PostgreSQL
     - Redis (cache)
     - Backend Node.js
     - Frontend Next.js

5. **Acessar Aplicação**
   - Railway fornece URLs públicas automaticamente
   - Frontend: `https://seu-projeto.up.railway.app`
   - Backend API: `https://seu-projeto-api.up.railway.app`

---

## Opção 2: Vercel + Railway (Separado)

### Para o Frontend (Next.js):
1. Deploy no Vercel (https://vercel.com)
2. Conecta repo GitHub
3. Em 1 clique sobe o Next.js
4. Muito rápido e FREE

### Para o Backend:
1. Deploy no Railway (backend + DB)
2. Aponta frontend para API do Railway

---

## Opção 3: DigitalOcean App Platform

### Passo a Passo:
1. Crie conta em https://www.digitalocean.com
2. Acesse "App Platform"
3. "Create App" → "GitHub"
4. Selecione repo
5. Configure services
6. Deploy automático

---

## Opção 4: AWS (Mais Profissional)

### Serviços Necessários:
- **AWS ECS** ou **App Runner** para containers
- **RDS** para PostgreSQL
- **ElastiCache** para Redis
- **CloudFront** para CDN (opcional)

### Complexidade: ⭐⭐⭐⭐ (mais complexo)

---

## 📋 Checklist Pré-Deploy

- [ ] `.env` configurado com senhas fortes
- [ ] `docker-compose.prod.yml` atualizado
- [ ] Secrets sensíveis em variáveis de ambiente
- [ ] URLs de API atualizadas para produção
- [ ] Logs configurados
- [ ] Backups de DB ativados
- [ ] Domain customizado (opcional)
- [ ] SSL/TLS ativado (automático em Railway)

---

## 🔐 Segurança

**NUNCA commitar no GitHub:**
- Senhas do banco
- JWT secrets
- Chaves de API
- URLs privadas

**Usar sempre:**
- `.env` local (não commitado)
- Variáveis de ambiente na plataforma
- GitHub Secrets para CI/CD

---

## 📊 Custos Estimados (Mensal)

| Serviço | Railway | Vercel | DigitalOcean | AWS |
|---------|---------|--------|--------------|-----|
| Backend | $5+ | - | $5-12 | $10-50 |
| Frontend | - | FREE | - | $5-20 |
| Database | Incluso | - | $15 | $15-40 |
| **Total** | **$5/mês** | **FREE** | **$20/mês** | **$30-110/mês** |

---

## 🆘 Troubleshooting

### Erro: "Build failed"
- Verifique `Dockerfile` está correto
- Confirme que `package.json` existe
- Veja logs no dashboard

### Erro: "Database connection refused"
- Confirme `DATABASE_URL` está correto
- Verifique senhas em variáveis de ambiente
- Railway TB precisa criar DB first

### Erro: "Port already in use"
- Railway atribui port automaticamente (ignorar PORT hardcoded)
- Usar variável de ambiente: `process.env.PORT || 3000`

---

## 📞 Suporte

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- DigitalOcean: https://www.digitalocean.com/docs

---

## ✅ Após Deploy

1. Teste todas as funcionalidades
2. Configure domain customizado
3. Ative backups automáticos
4. Configure monitoring/alerts
5. Adicione CI/CD pipeline

---

**Recomendação Final:** Use Railway para começar agora (5 min), depois migra para AWS quando escalar! 🚀
