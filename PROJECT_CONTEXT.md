# Projeto Barbearia do Artur - Contexto Técnico e Estratégico

## Visão Geral

Barbearia do Artur é um produto SaaS verticalizado de gestão para salões de beleza, com foco em clientes, staff e gestão administrativa. O projeto deve ser desenvolvido como uma plataforma enterprise pronta para comercialização, com arquitetura modular, multi-tenant, desempenho alto e segurança LGPD.

## Objetivo do Projeto

Construir um ecossistema completo com três interfaces integradas:

1. App Cliente (Mobile Flutter)
2. App Staff / Profissional (Mobile/Tablet Flutter)
3. Painel Administrativo / Gestão (Web Next.js + TypeScript)

O backend será uma API NestJS com PostgreSQL, Redis e BullMQ. O produto será dockerizado e preparado para deploy em nuvem (AWS / Render / Railway).

## Papéis Técnicos Atuados

* CTO
* Principal Engineer
* Product Manager
* Senior Backend Engineer
* Senior Mobile Engineer
* Senior UX/UI Designer
* DBA Senior
* DevOps Engineer

## Princípios de Arquitetura

* Clean Architecture
* Domain-Driven Design
* SOLID
* Repository Pattern
* Service Layer
* Feature-first modularization
* Component-driven frontend
* Multi-tenant SaaS ready
* Performance e segurança desde o início

## Segurança Multi-Tenant Obrigatória

O projeto deve evoluir para isolamento real por tenant também no banco, não apenas na aplicação.

### Requisito obrigatório

* Implementar Row Level Security (RLS) no PostgreSQL para tabelas multi-tenant
* Garantir políticas baseadas em `tenant_id`
* Garantir propagação segura do contexto do tenant entre backend e banco
* Evitar depender exclusivamente de filtros manuais na aplicação para isolamento de dados

### Regra prática

Sempre que um módulo envolver dados de tenant, considerar desde a modelagem:

* coluna `tenant_id`
* policy de leitura
* policy de escrita
* estratégia de contexto transacional para o tenant atual

## Requisitos Obrigatórios

### Stack

* Frontend Mobile: Flutter (Riverpod / BLoC, Feature-First)
* Painel Web: Next.js + React + TypeScript
* Backend: Node.js + NestJS
* Banco de Dados: PostgreSQL
* Cache: Redis
* Jobs/Filas: BullMQ
* Containerização: Docker
* Infraestrutura: AWS/Render/Railway ready

### Domínios Principais

* Agendamento Inteligente
* CRM Avançado
* Gestão Financeira / ERP
* Fidelização / Retenção
* BI / Analytics
* Segurança / Auditoria / LGPD

## Fases do Projeto

1. ✅ Arquitetura do monorepo e documentação de contexto
2. ✅ Modelagem de dados e tabela inicial PostgreSQL
3. ✅ Backend básico com módulos de autenticação, tenants, agenda, clientes, profissionais e serviços
4. ✅ API REST/GraphQL inicial e documentação Swagger/OpenAPI
5. ✅ Infraestrutura Docker local e pipelines CI/CD de base
6. 🔄 Frontend Web painel administrativo com layout e componentes atômicos
7. 🔄 Frontend Mobile cliente e staff com navegação e UX premium
8. 🔄 Regras de negócio avançadas de agenda, CRM, comissões e financeiro
9. 🔄 Testes unitários, integração e E2E para fluxos principais
10. 🔄 Monitoramento, health checks, backup e deploy de produção

## Critérios de Qualidade

* Código modular e coeso
* Arquivos pequenos e responsabilidades claras
* Controllers/UI finos, regras de negócio nos serviços/use-cases
* DTO validation e tratamento centralizado de erros
* Logging estruturado e auditoria
* Cache e otimização de consultas
* Testes automatizados e cobertura relevante
* Isolamento de dados com RLS para domínios multi-tenant

## Nota de Uso

Este arquivo é a fonte de verdade do projeto. Todas as decisões técnicas e arquiteturais devem referenciar este documento antes de serem executadas. Se for necessário ajustar o escopo ou priorização, documentar a justificativa técnica no próprio arquivo.
