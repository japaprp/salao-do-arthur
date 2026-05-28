# Barbearia do Artur - Arquitetura Oficial do Produto

## Visão do produto

`Barbearia do Artur` é um produto multi-superfície para operação de salão de beleza com:

- aplicativo do cliente
- área operacional do profissional
- painel administrativo
- motor de agendamento
- CRM, fidelidade e retenção
- promoções e campanhas
- catálogo e venda de produtos
- galeria de trabalhos
- notificações e automações
- relatórios operacionais e financeiros
- segurança e auditoria para produção real

## Stack oficial

- `mobile`: Flutter + Riverpod + GoRouter + Dio
- `admin/web`: Next.js + TypeScript + MUI + React Query
- `backend`: NestJS + TypeScript + class-validator + Swagger
- `database`: PostgreSQL + Prisma
- `auth`: JWT de acesso + estrutura preparada para refresh/session hardening
- `jobs/filas`: Redis + BullMQ
- `storage`: S3 ou compatível
- `push`: Firebase Cloud Messaging
- `payments`: Stripe / Mercado Pago / Pix por adaptadores
- `deploy`: Docker + ambientes cloud
- `observabilidade`: logs estruturados, auditoria, health checks, métricas e tracing-ready

## Macro-domínios

### 1. Identity & Access

- `auth`
- `users`
- `roles`
- `permissions`
- `admins`
- `sessions`

Responsabilidades:

- autenticação
- autorização por perfil e permissão
- gestão de sessão
- recuperação de senha
- verificação de identidade
- auditoria de acesso

### 2. Scheduling & Operations

- `appointments`
- `appointment-services`
- `appointment-history`
- `waitlist`
- `professionals`
- `working-hours`
- `time-off`
- `resources`

Responsabilidades:

- agenda do cliente
- agenda do profissional
- agenda geral do salão
- disponibilidade
- múltiplos serviços por atendimento
- encaixe, fila de espera, bloqueios e no-show

### 3. CRM, Loyalty & Relationship

- `clients`
- `loyalty`
- `referrals`
- `reviews`
- `support`
- `favorites`

Responsabilidades:

- relacionamento com clientes
- retenção
- fidelidade
- indicação
- histórico
- suporte

### 4. Catalog, Commerce & Payments

- `service-categories`
- `services`
- `service-addons`
- `products`
- `inventory`
- `carts`
- `orders`
- `payments`
- `refunds`

Responsabilidades:

- catálogo de serviços
- catálogo de produtos
- estoque
- carrinho
- checkout
- pedidos
- pagamentos
- estornos

### 5. Marketing & Content

- `promotions`
- `coupons`
- `campaigns`
- `banners`
- `gallery`
- `notifications`
- `notification-templates`

Responsabilidades:

- promoções
- cupons
- campanhas segmentadas
- conteúdo visual
- comunicação e automações

### 6. Performance, Finance & Governance

- `commissions`
- `commission-rules`
- `goals`
- `reports`
- `audit`
- `activity-logs`
- `settings`
- `files`

Responsabilidades:

- metas
- comissão
- relatórios
- auditoria
- configurações do salão
- governança operacional

## Estratégia de superfícies

### App do cliente

Foco:

- descoberta
- agendamento
- recompra
- fidelização
- notificações
- histórico e conveniência

### Área do profissional

Foco:

- agenda do dia
- disponibilidade
- atendimento
- clientes do dia
- comissões
- metas

### Painel administrativo

Foco:

- operação completa
- agenda geral
- cadastro
- campanhas
- estoque
- pedidos
- pagamentos
- relatórios
- auditoria

## Padrões arquiteturais

- modularização por domínio
- separação clara entre `controller`, `service`, `repository`, `dto/schema`
- regras de negócio fora da UI
- autorização centrada em guard + permissão
- config centralizada por ambiente
- logs estruturados
- auditoria para ações críticas
- integrações externas por adaptadores
- filas para automações, notificações e tarefas assíncronas
- modelos preparados para histórico e soft delete onde fizer sentido

## Regras de implementação

- o projeto do `salao` é apenas o aplicativo do salão
- portfólio pessoal fica fora deste repositório
- toda expansão deve respeitar multi-tenant
- contratos públicos devem ser tipados e versionáveis
- novas features entram por domínio, nunca como código espalhado
- mudanças de modelagem devem preservar compatibilidade sempre que possível

## Ordem oficial de evolução

1. arquitetura oficial e modelagem completa
2. módulos centrais de backend
3. design system premium e padrões de UX
4. fluxos do app cliente
5. fluxos da área profissional
6. fluxos do painel administrativo
7. e-commerce, promoções, pagamentos e retenção
8. segurança avançada, auditoria, observabilidade e deploy
9. refinamento final de consistência e produção
