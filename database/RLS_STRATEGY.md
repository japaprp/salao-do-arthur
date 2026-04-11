# RLS Strategy

## Objetivo

Garantir isolamento de dados por tenant no PostgreSQL com Row Level Security, reduzindo o risco de vazamento entre salões.

## Escopo Inicial

Aplicar RLS nas tabelas com `tenant_id`, incluindo:

- `clients`
- `professionals`
- `services`
- `appointments`
- `resources`
- `transactions`
- `commissions`
- `loyalty_wallets`
- `campaigns`
- `notifications`
- `audit_logs`

### Fase 2

- `users`

Justificativa:
- o login atual ainda não resolve tenant na entrada
- endurecer `users` antes disso quebraria o bootstrap de autenticação
- a tabela continua no roadmap de segurança, mas não deve entrar na primeira aplicação operacional de RLS

## Estratégia Recomendada

1. manter `tenant_id` obrigatório em tabelas multi-tenant
2. habilitar `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
3. criar policies de `SELECT`, `INSERT`, `UPDATE` e `DELETE`
4. definir o tenant atual por contexto de conexão/transação no backend
5. manter filtros da aplicação como defesa adicional, não como única barreira

## Diretriz Backend

Ao usar NestJS + Prisma, a camada de infraestrutura deve garantir que cada request autenticada propague o `tenantId` para o banco de forma consistente.

Abordagens possíveis:

- `SET LOCAL app.current_tenant_id = '...'` por transação
- policies consultando `current_setting('app.current_tenant_id', true)`
- uso de roles dedicadas apenas se isso não aumentar complexidade operacional sem ganho real

## Riscos se não implementar

- vazamento entre salões por falha de filtro na aplicação
- regressões silenciosas em novos módulos
- multi-tenant apenas aparente, não defensável em produção

## Observação

O schema atual já foi modelado com `tenant_id` em grande parte dos domínios. Isso facilita a adoção de RLS, mas a proteção ainda não deve ser considerada completa até as policies existirem de fato.
