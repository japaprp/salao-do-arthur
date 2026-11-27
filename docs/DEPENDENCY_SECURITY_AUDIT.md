# Auditoria de dependências — backend

**Escopo:** `backend/package-lock.json`, executado no GitHub Actions em 27/11/2026, Node.js 22.

## Resultado observado

A instalação `npm ci` reportou **36 vulnerabilidades**: 1 baixa, 20 moderadas, 13 altas e 2 críticas. A etapa `npm audit --audit-level=high` foi adicionada ao CI em modo de relatório (`continue-on-error`) para permitir que type-check, lint, build e testes continuem; portanto, o estado verde dessa etapa **não significa ausência de vulnerabilidades**.

O relatório identificou, entre outros, estes pacotes transitivos:

| Pacote | Severidade observada | Origem/caminho indicado no relatório |
|---|---|---|
| `handlebars` | CRITICAL | dependência transitiva presente no grafo de `@nestjs/swagger` |
| `proxy-addr` | CRITICAL | dependência transitiva do stack HTTP |
| `@fastify/busboy` | HIGH | dependência transitiva |
| `@grpc/grpc-js` | HIGH | dependência transitiva |
| `body-parser` | HIGH | stack HTTP |
| `brace-expansion` | HIGH | ferramentas/transitivas |
| `browserslist` | HIGH | ferramentas de build |
| `deepmerge-ts` | HIGH | `@prisma/config` / Prisma CLI |
| `effect` | HIGH | Prisma CLI |
| `fast-uri` | HIGH | dependência transitiva |
| `js-yaml` | HIGH | ferramentas/transitivas |
| `multer` | HIGH | `@nestjs/platform-express` |
| `baseline-browser-mapping` | MODERATE | ferramenta de build |
| `glob` | MODERATE | CLI/ferramentas transitivas |
| `minimatch` | MODERATE | CLI/ferramentas transitivas |
| `protobufjs` | MODERATE | dependência transitiva |
| `qs` | MODERATE | stack HTTP |
| `uuid` | MODERATE | dependência transitiva |

O relatório indicou que parte das correções cabe em `npm audit fix`. Para `deepmerge-ts` e `effect`, o caminho sugerido exigiria atualizar o Prisma para 7.10.1, uma mudança major fora da linha atual Prisma 6. **Não foi executado `npm audit fix --force` nem atualização major automática.**

## Resultado observado — web

O `npm ci` do frontend reportou **28 vulnerabilidades**: 17 moderadas, 10 altas e 1 crítica. O audit detalhado identificou:

| Pacote | Severidade observada | Observação |
|---|---|---|
| `next` | CRITICAL | O lockfile usa Next 16.2.9; o advisory alcança versões até 16.4.4 |
| `axios` | HIGH | intervalo afetado indicado pelo audit: 1.0.0–1.19.0 |
| `brace-expansion` | HIGH | dependência transitiva |
| `browserslist` | HIGH | ferramenta de build |
| `follow-redirects` | HIGH | dependência transitiva do stack HTTP |
| `js-yaml` | HIGH | ferramenta/transitiva |
| `nanoid` | HIGH | dependência transitiva |
| `postcss` | HIGH | ferramenta de build |
| `sharp` | HIGH | o audit apontou CVEs herdadas em libvips |
| `source-map-js` | HIGH | dependência transitiva |
| `zod` | HIGH | dependência transitiva |
| `baseline-browser-mapping`, `glob`, `minimatch` | MODERATE | ferramentas/transitivas |

O Next.js está no runtime de produção do frontend, portanto a vulnerabilidade crítica do pacote é um **bloqueio direto de release**, não apenas uma pendência de desenvolvimento. Atualizar Next, `eslint-config-next` e os binários opcionais SWC exige atualizar também o lockfile e validar build/testes. Nenhuma atualização foi aplicada automaticamente.

## Estado e decisão

- **PASS:** auditoria informativa incorporada aos workflows de build; gate separado bloqueante em `.github/workflows/security-audit.yml` reprova high/critical.
- **BLOCKED:** backend 36 vulnerabilidades (13 altas, 2 críticas) e web 28 vulnerabilidades (10 altas, 1 crítica) ainda presentes; não há evidência de correção nos lockfiles.
- **NOT RUN:** validação completa do grafo de produção com `npm audit --omit=dev`.
- **NOT RUN:** atualização controlada dos pacotes transitivos, seguida de testes de regressão.
- **NOT RUN:** análise de compatibilidade e plano de migração para Prisma 7.
- **NOT RUN:** auditoria de vulnerabilidades do grafo Flutter/Dart; o CI atual cobre analyze/test, mas não executa auditoria de advisories Dart.

## Próximas ações técnicas

1. Separar vulnerabilidades de runtime e de desenvolvimento usando `npm audit --omit=dev` nos dois projetos.
2. Atualizar Next.js e dependências associadas para versão corrigida, atualizar lockfile com npm e validar regressões; tratar a vulnerabilidade crítica como prioridade máxima.
3. Aplicar primeiro correções compatíveis e não-breaking, atualizando o lockfile por ferramenta npm — sem editar integridades manualmente.
4. Reexecutar type-check, lint, build, testes unitários e smoke MySQL.
5. Tratar Prisma 7 em mudança isolada: revisar breaking changes, migrações, Prisma Client, transações e testes antes de adotar.
6. Tornar o audit de produção bloqueante antes da liberação de produção.

**Regra de release:** não publicar enquanto vulnerabilidades críticas/altas de runtime permanecerem sem mitigação documentada e aceita.
