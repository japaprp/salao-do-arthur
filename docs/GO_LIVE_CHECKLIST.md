# Checklist de prontidão — Salão do Arthur

Este checklist é interno. Não marcar PASS sem evidência reproduzível. Os estados possíveis são PASS, FAIL, BLOCKED e NOT RUN.

| Etapa | Escopo | Estado atual |
|---|---|---|
| 1 | Auditoria completa de código, dependências, arquitetura e configuração | BLOCKED — npm ci reportou backend 36 vulnerabilidades (1 baixa, 20 moderadas, 13 altas, 2 críticas) e web 28 (17 moderadas, 10 altas, 1 crítica, incluindo Next.js); relatório em docs/DEPENDENCY_SECURITY_AUDIT.md; correções pendentes |
| 2 | Segurança, autenticação, autorização e isolamento entre tenants | BLOCKED — cobertura estrutural dos 53 modelos com tenantId, preservação de JSON/Date, access token web em memória e refresh token HttpOnly; app nativo usa endpoints separados e flutter_secure_storage; modelos relacionais sem tenantId e SQL bruto ainda exigem auditoria (docs/TENANT_ISOLATION_AUDIT.md); TRUST_PROXY_HOPS explicitado, topologia real não verificada |
| 3 | Integridade do banco, transações, concorrência e migrações | BLOCKED — 12 migrações aplicadas em MySQL 8.4 descartável pelo CI; preflight de duplicidades e execução/backup em banco real não realizados |
| 4 | Pagamentos, webhooks, estornos e idempotência | BLOCKED — testes unitários de webhooks/estornos PASS; sandbox Mercado Pago, conciliação e testes concorrentes contra provedor não executados |
| 5 | Financeiro, receitas, despesas, comissões e conciliação | BLOCKED — correção de dupla contagem e unicidade implementadas; conciliação e fechamento de caixa não homologados |
| 6 | Agenda, profissionais, horários e cancelamentos | BLOCKED — smoke concorrente PASS (uma reserva aceita e outra conflito); jornada semanal recorrente não possui tela administrativa e a janela provisória permanece fixa em 09h–19h todos os dias |
| 7 | Clientes, histórico, pontos e notificações | NOT RUN — validação completa pendente |
| 8 | Painel administrativo e permissões por perfil | NOT RUN — teste com contas separadas pendente |
| 9 | Web e aplicativo móvel, responsividade e acessibilidade | BLOCKED — CI web PASS (3 suítes/11 testes), mobile PASS (3 testes); Flutter ainda reporta 34 infos de depreciação do material.dart; teste em dispositivos reais, responsividade e acessibilidade pendentes |
| 10 | Automações, lembretes e recuperação de falhas | NOT RUN — teste integrado pendente |
| 11 | Infraestrutura, domínio, HTTPS, banco e variáveis | BLOCKED — MySQL externo, domínio, segredos e capacidade não verificados; frontend GitHub Pages e API Render são cross-site, incompatíveis com o refresh cookie SameSite=Lax atual sem domínio próprio ou fluxo cross-site homologado |
| 12 | Backups, restauração, monitoramento e recuperação | BLOCKED — não há evidência de restauração real |
| 13 | Publicação controlada e rollback | BLOCKED — workflows protegidos; publicação e rollback não executados |
| 14 | Homologação final e simulação de operação | NOT RUN — exige ambiente isolado, sandbox e dispositivo real |
| 15 | Treinamento, manual e entrega assistida | BLOCKED — manual preliminar criado; treinamento e aceite do Arthur não realizados |

## Evidências e decisões desta branch

- Branch de trabalho: fix/release-readiness-20261127.
- A main não recebeu as correções do produto. A branch foi atualizada com a main por commit de merge dentro da própria branch; PR #2 permanece draft e não foi mesclado em main.
- O npm ci do backend reportou 36 vulnerabilidades: 1 baixa, 20 moderadas, 13 altas e 2 críticas. A etapa npm audit está em modo relatório e o release continua bloqueado por esse achado.
- Nenhum merge do PR em main, deploy ou publicação foi executado.
- CI backend: type-check, lint, build e 86 testes unitários PASS no commit 56bcd5b; smoke MySQL de revalidação desse commit em execução.
- Smoke MySQL anterior PASS: 12 migrações aplicadas, seed, healthcheck e concorrência (uma reserva aceita e outra conflito).
- CI web: 3 suítes e 11 testes PASS, type-check, lint e build PASS. CI mobile: analyze e 3 testes PASS; 34 infos de depreciação do Material ainda precisam de migração futura.
- Correção de tenant wrapper preserva campos JSON, Date e objetos de valor; o smoke concorrente comprovou a correção no MySQL descartável.
- Web não persiste access token no localStorage; refresh token fica em cookie HttpOnly. Mobile usa endpoints próprios e armazenamento seguro. A combinação atual GitHub Pages + Render ainda é incompatível com SameSite=Lax sem domínio próprio; ver PRODUCTION_DEPLOYMENT.md.
- CI web: 2 suítes e 8 testes PASS, type-check, lint e build PASS. CI mobile: analyze e testes PASS.
- Uma nova validação completa precisa rodar sobre o HEAD mais recente antes de classificar o conjunto de correções como PASS.
- O manual operacional é preliminar, com rota correta de onboarding do proprietário (/auth/register/admin), e não deve ser tratado como aceite de produção.
- O Render Blueprint declara TRUST_PROXY_HOPS=1; confirmar a topologia efetiva de proxies antes da produção.

## Critérios de liberação

1. Todas as etapas 1–14 devem ter evidência PASS, ou exceções documentadas e aceitas formalmente pelo responsável.
2. Nenhum FAIL aberto em isolamento entre tenants, agenda, pagamentos, estornos, estoque ou integridade financeira.
3. Banco MySQL persistente, TLS, backups automáticos e restauração comprovada.
4. Checkout desligado por padrão; ativação também exige liberação técnica explícita (`MERCADO_PAGO_CHECKOUT_READY=true`) após sandbox, webhooks e conciliação aprovados.
5. Manual validado com Arthur em sessão assistida; ele deve conseguir operar os fluxos sem terminal ou acesso técnico.
6. Publicação somente após autorização específica para go-live.
