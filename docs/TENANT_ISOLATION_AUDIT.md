# Auditoria de isolamento multi-tenant

**Escopo:** `backend/prisma/schema.prisma` versus `backend/src/prisma/prisma.service.ts`, branch de homologação.

## Cobertura estrutural

A comparação automatizada do schema com `TENANT_SCOPED_MODELS` encontrou:

- 53 modelos Prisma com campo `tenantId`.
- 53 modelos listados no wrapper.
- 0 modelos com `tenantId` ausentes da lista.
- 0 entradas na lista sem campo `tenantId` correspondente.

O wrapper aplica o tenant nas operações de leitura e escrita listadas e rejeita um `tenantId` divergente. Campos JSON são preservados sem injeção recursiva de tenant; objetos de valor como `Date`, `Prisma.Decimal` e `Buffer` também são preservados.

## Modelos sem tenantId direto

| Modelo | Tratamento necessário |
|---|---|
| `Tenant` | entidade raiz; consulta global deve ser restrita ao fluxo de resolução/gestão de tenant |
| `PaymentWebhookEvent` | registro global do provedor, protegido por chave composta do evento; não deve ser exposto por rotas de tenant |
| `RolePermission` | validar tenant pelas relações `role` e `permission` |
| `UserRoleAssignment` | validar tenant pelas relações `user` e `role` |
| `UserPermission` | validar tenant pelas relações `user` e `permission` |
| `ResourceBooking` | validar tenant pelas relações `resource` e/ou `appointment` |
| `RefreshToken` | validar propriedade por `userId` e revogar somente tokens do usuário autenticado |

## Limites ainda não fechados

1. A lista de modelos sem `tenantId` foi identificada, mas todos os call sites de cada modelo ainda precisam ser revisados.
2. Consultas SQL brutas não passam pelo Prisma query extension. O uso encontrado no fluxo de estorno filtra por `payment.id` e `tenantId`; a busca sistemática de todos os usos brutos ainda não está concluída.
3. Os testes unitários cobrem injeção de tenant em leitura/criação, rejeição de tenant divergente, ausência de contexto e preservação de JSON/Date. Ainda faltam testes de integração negativos para todos os modelos e relações.
4. Não houve teste com dois tenants reais em banco isolado, nem teste de autorização por perfil em todas as rotas.

## Estado

- **PASS:** cobertura estrutural dos 53 modelos que possuem `tenantId`.
- **PASS:** testes unitários atuais do backend (14 suítes, 82 testes) na execução mais recente concluída.
- **BLOCKED:** auditoria dos cinco modelos relacionais sem tenantId e dos call sites SQL brutos.
- **NOT RUN:** suíte de integração cross-tenant abrangente com dois tenants independentes.

A etapa de isolamento multi-tenant permanece **BLOCKED** para liberação de produção até que os itens acima sejam comprovados.
