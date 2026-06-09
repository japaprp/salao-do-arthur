# ROADMAP OFICIAL - BARBEARIA DO ARTUR

## Objetivo

Transformar o projeto atual em uma plataforma completa de gestão para a Barbearia do Artur, pronta para produção, com:

* Aplicativo Flutter para clientes
* Aplicativo Flutter para administrador/profissionais
* Backend NestJS
* Banco MySQL + Prisma
* Painel Web Next.js
* Integração de pagamentos
* Programa de fidelidade
* Notificações
* Publicação na Play Store

---

# FASE 1 - AUDITORIA E LIMPEZA

Objetivo: estabilizar a base antes de criar novas funcionalidades.

## Tarefas

* Revisar toda estrutura Feature First.
* Remover código morto.
* Remover duplicações.
* Corrigir imports inválidos.
* Padronizar nomenclatura.
* Revisar DTOs.
* Revisar Models Prisma.
* Revisar Providers.
* Revisar Services.
* Revisar Repositories.
* Garantir build sem warnings.

## Critério de conclusão

* Backend build OK.
* Web build OK.
* Flutter analyze sem erros.
* Flutter test executando.

---

# FASE 2 - SEGURANÇA

Objetivo: preparar para usuários reais.

## Mobile

Migrar:

shared_preferences

para

flutter_secure_storage

para:

* Access Token
* Refresh Token
* Dados sensíveis

## Backend

Implementar:

* Refresh token rotativo
* Auditoria
* Logs
* Rate limiting avançado
* Controle por roles

Roles:

* CLIENT
* PROFESSIONAL
* ADMIN
* OWNER

## Critério de conclusão

* Tokens seguros.
* Controle de acesso validado.

---

# FASE 3 - AGENDAMENTO COMPLETO

Objetivo: fechar o principal fluxo do negócio.

## Cliente

* Agendar
* Reagendar
* Cancelar
* Histórico

## Profissional

* Confirmar atendimento
* Iniciar atendimento
* Finalizar atendimento

## Administrador

* Bloquear horários
* Criar folgas
* Ajustar agenda

## Critério

Fluxo completo funcionando ponta a ponta.

---

# FASE 4 - NOTIFICAÇÕES

Objetivo: reduzir faltas.

## Implementar

Firebase Cloud Messaging.

Eventos:

* Agendamento criado
* Agendamento confirmado
* Agendamento cancelado
* Lembrete 24h antes
* Lembrete 1h antes

## Critério

Push funcionando Android.

---

# FASE 5 - LOJA ONLINE

Objetivo: vender produtos.

## Implementar

* Carrinho
* Favoritos
* Checkout
* Pedido
* Histórico

## Banco

Validar:

* Product
* Order
* OrderItem
* Inventory

## Critério

Compra completa funcionando.

---

# FASE 6 - PAGAMENTOS

Objetivo: monetização real.

## Gateway

Implementar Mercado Pago.

Fluxos:

* Pix
* Cartão
* Estorno

## Backend

* Payment
* Refund
* Webhooks

## Critério

Pagamento aprovado e registrado automaticamente.

---

# FASE 7 - FIDELIDADE

Objetivo: retenção de clientes.

## Implementar

* Pontos
* Cashback
* Níveis

Níveis:

* Bronze
* Prata
* Ouro
* Diamante

## Recursos

* Histórico
* Resgate
* Benefícios

## Critério

Sistema operacional completo.

---

# FASE 8 - FINANCEIRO

Objetivo: gestão da empresa.

## Implementar

* Caixa diário
* Receitas
* Despesas
* Comissões
* Lucro

## Dashboard

* Mensal
* Semanal
* Anual

## Critério

Administrador acompanha faturamento completo.

---

# FASE 9 - RELATÓRIOS

## Implementar

* Serviços mais vendidos
* Produtos mais vendidos
* Clientes recorrentes
* Ticket médio
* Taxa de retorno

## Exportação

* PDF
* Excel

---

# FASE 10 - TESTES

## Backend

Cobertura mínima:

80%

## Web

Cobertura mínima:

70%

## Mobile

Cobertura mínima:

70%

## E2E

Fluxos:

* Cadastro
* Login
* Agendamento
* Compra
* Pagamento

---

# FASE 11 - PRODUÇÃO

## Infraestrutura

* HTTPS
* Domínio
* Banco produção
* Backup automático
* Monitoramento

## Logs

* API
* Mobile
* Web

## Critério

Ambiente estável para usuários reais.

---

# FASE 12 - PLAY STORE

## Preparação

* Política de Privacidade
* Termos de Uso
* Ícones
* Splash
* Screenshots

## Android

Gerar:

* AAB Release

## Publicação

* Teste Interno
* Teste Fechado
* Produção

---

# RESULTADO FINAL ESPERADO

Sistema completo contendo:

* Aplicativo do Cliente
* Aplicativo Administrativo
* Agendamentos
* Loja
* Pagamentos
* Fidelidade
* Relatórios
* Financeiro
* Notificações
* Backend escalável
* Publicação Play Store

Nenhuma funcionalidade nova deve ser iniciada antes da conclusão e validação da fase anterior.
