# RLS Implementation Guide

## Objetivo

Transformar o isolamento multi-tenant em proteção real de banco, não apenas convenção de aplicação.

## O que este guia entrega

- função SQL para recuperar o tenant atual via `current_setting`
- policies de RLS para os domínios multi-tenant já preparados para contexto autenticado
- policies indiretas para tabelas filhas como `resource_bookings` e `loyalty_transactions`
- orientação de integração com NestJS + Prisma

## Ordem recomendada

1. aplicar `database/schema.sql`
2. aplicar `database/rls_policies.sql`
3. garantir que todo acesso multi-tenant no backend rode com contexto de tenant definido
4. manter filtros na aplicação como defesa adicional

## Como propagar o tenant no backend

O PostgreSQL só consegue aplicar as policies se a conexão/transação atual conhecer o tenant ativo.

Abordagem recomendada com Prisma:

```ts
await prisma.$transaction(async (tx) => {
  await tx.$executeRaw`
    SELECT set_config('app.current_tenant_id', ${tenantId}, true)
  `;

  return tx.appointment.findMany({
    where: {
      status: "SCHEDULED",
    },
  });
});
```

## Regras práticas

- usar `SET LOCAL` ou `set_config(..., true)` no começo de cada transação request-scoped
- evitar operações multi-tenant fora de transação quando RLS estiver ativa
- não confiar só em `where: { tenantId }` na aplicação
- manter `tenant_id` obrigatório em todo domínio que pertença ao salão
- para tabelas filhas sem `tenant_id`, criar policy via relacionamento com a tabela pai

## Tabelas que merecem atenção especial

- `users`: agora o login já resolve tenant por subdomínio antes de consultar usuário; isso permite aplicar RLS nesta tabela, desde que não existam consumidores legados fazendo login global por email
- `appointments`: além de RLS, precisa de regra robusta de conflito de agenda
- `notifications` e `audit_logs`: devem sempre carregar contexto de tenant antes de gravação
- `appointment_services`: existe no SQL bruto, mas não está modelada no Prisma atual; esse drift precisa ser resolvido

## Limitações atuais do projeto

- o backend agora já possui `PrismaService.withTenant(...)`, mas ainda não migrou 100% dos fluxos para esse padrão
- a resolução do tenant no login já existe via subdomínio, mas ainda precisa ser validada em ambiente real com policies ativas no banco
- as policies agora estão prontas para aplicação nos domínios de negócio, mas ainda não foram validadas em ambiente real
- Prisma e schema SQL ainda têm alguns pontos de drift estrutural que precisam ser unificados
- o smoke local novo do backend usa um Postgres temporário modelado pelo Prisma para validar runtime; isso ajuda auth/agendamento, mas não substitui a validação final do RLS contra o `schema.sql` oficial com policies aplicadas

## Próximo passo técnico recomendado

Criar uma abstração de infraestrutura no backend para:

1. abrir transação por request autenticada
2. aplicar `set_config('app.current_tenant_id', tenantId, true)`
3. executar repositórios sobre esse contexto
4. manter o login por tenant/subdomínio como contrato oficial e remover consumidores legados sem contexto de tenant
5. registrar auditoria básica por ação crítica
