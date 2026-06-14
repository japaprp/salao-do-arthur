# Estabilidade Login Localhost Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** impedir regressões no login, no carregamento do localhost e no fluxo básico cliente/admin antes de avançar fases novas.

**Architecture:** manter validações leves e repetíveis fora de upgrades major. O backend continua sendo a fonte de verdade para autenticação/RBAC; a web só valida fluxo e rotas renderizadas. O script de smoke testa os servidores já iniciados, sem instalar dependências nem reiniciar serviços.

**Tech Stack:** PowerShell, Next.js 13.4, NestJS, Prisma/MySQL, API REST local em `127.0.0.1:3100`, web local em `127.0.0.1:3001`.

---

### Task 1: Plano De Smoke Local

**Files:**
- Create: `scripts/smoke-local.ps1`
- No test file; validation is the script execution itself.

- [ ] **Step 1: Criar script de smoke sem dependências novas**

```powershell
Param(
  [string]$WebBaseUrl = "http://127.0.0.1:3001",
  [string]$ApiBaseUrl = "http://127.0.0.1:3100/api",
  [string]$TenantSubdomain = "barbearia-do-artur",
  [string]$ClientEmail = "cliente.demo@barbeariadoartur.app",
  [string]$ClientPassword = "Cliente123!",
  [int]$TimeoutSeconds = 90
)
```

- [ ] **Step 2: Validar páginas web principais**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-local.ps1
```

Expected:

```txt
[OK] WEB /auth/login -> 200
[OK] WEB /client -> 200
```

- [ ] **Step 3: Validar API e login cliente**

Expected:

```txt
[OK] API /health -> 200
[OK] API login cliente -> CLIENT
[OK] API /auth/profile -> CLIENT
```

Note: `POST /auth/login` returns HTTP 201 in this NestJS app because the controller does not override the default POST status.

### Task 2: Validação De Type-Check

**Files:**
- No source changes.

- [ ] **Step 1: Rodar type-check web**

Run:

```powershell
$nodeDir=Join-Path $env:LOCALAPPDATA 'CodexTools\node-v20.19.2-win-x64'
& (Join-Path $nodeDir 'npm.cmd') run type-check
```

Expected in `web`:

```txt
> tsc --noEmit
```

- [ ] **Step 2: Rodar type-check backend**

Run:

```powershell
$nodeDir=Join-Path $env:LOCALAPPDATA 'CodexTools\node-v20.19.2-win-x64'
& (Join-Path $nodeDir 'npm.cmd') run type-check
```

Expected in `backend`:

```txt
> tsc --noEmit -p tsconfig.json
```

### Task 3: Segurança Sem Upgrade Quebrado

**Files:**
- No immediate source changes.

- [ ] **Step 1: Rodar auditoria web**

Run:

```powershell
$nodeDir=Join-Path $env:LOCALAPPDATA 'CodexTools\node-v20.19.2-win-x64'
& (Join-Path $nodeDir 'npm.cmd') audit --omit=dev --audit-level=high
```

Expected current gap:

```txt
Next.js requires a planned major-compatible upgrade; do not run npm audit fix --force in the main working tree.
```

- [ ] **Step 2: Rodar auditoria backend**

Expected current gap:

```txt
Nest/Multer/Lodash require a planned migration; do not run npm audit fix --force in the main working tree.
```

### Task 4: Publicação Git

**Files:**
- Commit all completed changes.

- [ ] **Step 1: Conferir diff**

Run:

```powershell
git status -sb
git diff --stat
```

- [ ] **Step 2: Commitar e pushar**

Run:

```powershell
git add docs/superpowers/plans/2026-06-14-estabilidade-login-localhost.md scripts/smoke-local.ps1
git commit -m "chore: adiciona smoke guard local"
git push origin codex/barbearia-do-artur-super-app
```

- [ ] **Step 3: Confirmar GitHub**

Run:

```powershell
git ls-remote origin codex/barbearia-do-artur-super-app
```

Expected:

```txt
<commit-sha> refs/heads/codex/barbearia-do-artur-super-app
```
