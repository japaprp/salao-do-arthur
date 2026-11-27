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

## Estado e decisão

- **PASS:** auditoria incorporada ao CI e resultado capturado.
- **BLOCKED:** vulnerabilidades altas/críticas ainda presentes; não há evidência de correção no lockfile.
- **NOT RUN:** validação completa do grafo de produção com `npm audit --omit=dev`.
- **NOT RUN:** atualização controlada dos pacotes transitivos, seguida de testes de regressão.
- **NOT RUN:** análise de compatibilidade e plano de migração para Prisma 7.

## Próximas ações técnicas

1. Separar vulnerabilidades de runtime e de desenvolvimento usando `npm audit --omit=dev`.
2. Aplicar primeiro correções compatíveis e não-breaking, atualizando o lockfile por ferramenta npm — sem editar integridades manualmente.
3. Reexecutar type-check, lint, build, 82 testes unitários e smoke MySQL.
4. Tratar Prisma 7 em mudança isolada: revisar breaking changes, migrações, Prisma Client, transações e testes antes de adotar.
5. Tornar o audit de produção bloqueante antes da liberação de produção.

**Regra de release:** não publicar enquanto vulnerabilidades críticas/altas de runtime permanecerem sem mitigação documentada e aceita.
