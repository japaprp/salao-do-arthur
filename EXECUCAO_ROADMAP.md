# EXECUCAO DO ROADMAP - BARBEARIA DO ARTUR

Fonte oficial: `ROADMAP_OFICIAL.md`

Regra operacional: nenhuma funcionalidade nova deve ser iniciada antes da conclusao e validacao da fase anterior.

## Status por fase

| Fase | Nome | Status |
| --- | --- | --- |
| 1 | Auditoria e Limpeza | Validada |
| 2 | Seguranca | Validada |
| 3 | Agendamento Completo | Validada |
| 4 | Notificacoes | Codigo pronto; aguardando Firebase real |
| 5 | Loja Online | Validada em codigo |
| 6 | Pagamentos | Codigo pronto; aguardando sandbox Mercado Pago |
| 7 | Fidelidade | Bloqueada pela validação sandbox da Fase 6 |
| 8 | Financeiro | Bloqueada pela Fase 7 |
| 9 | Relatorios | Bloqueada pela Fase 8 |
| 10 | Testes | Bloqueada pela Fase 9 |
| 11 | Producao | Bloqueada pela Fase 10 |
| 12 | Play Store | Bloqueada pela Fase 11 |

## Fase 1 - Auditoria e Limpeza

### Correcoes aplicadas

* Corrigidos tipos inseguros e imports nao usados que bloqueavam `backend npm run lint:check`.
* Tipados helpers de cookies/refresh token no backend.
* Tipados validators customizados.
* Tipados mocks de specs do backend que usavam `any`.
* Removido import nao utilizado em repository de servicos de profissionais.

### Criterios oficiais

| Criterio | Status |
| --- | --- |
| Backend build OK | OK |
| Web build OK | OK |
| Flutter analyze sem erros | OK |
| Flutter test executando | OK |

### Observacoes

* Validacao executada com backend `type-check`, `lint:check`, `build` e `test`.
* Validacao executada com web `type-check`, `build` e `lint`.
* Validacao executada com mobile `flutter analyze` e `flutter test`.

## Fase 2 - Seguranca

### Correcoes aplicadas

* Mobile: tokens e dados sensiveis de sessao migrados para `flutter_secure_storage`.
* Backend: papel `OWNER` adicionado ao Prisma e ao contrato web.
* Backend: refresh token rotativo preservado e validado.
* Backend: `RolesGuard` registrado globalmente e coberto por teste unitario.
* Backend: rate limit especifico aplicado em login, cadastro, cadastro admin, forgot/reset password e refresh.
* Backend: middleware de logging aplicado globalmente.
* Backend: `AuditService` criado e eventos de auth registrados sem tokens, senhas ou links sensiveis.

### Validacao

* Backend `prisma:generate`, `type-check`, `lint:check`, `build` e `test`: OK.
* Web `type-check`, `build` e `lint`: OK.
* Mobile `flutter analyze` e `flutter test`: OK.

## Fase 3 - Agendamento Completo

### Status inicial

* Cliente backend: agendar, listar historico, reagendar e cancelar com politica.
* Cliente mobile: agendar, listar historico, reagendar e cancelar conectados ao backend.
* Profissional/painel web: check-in, iniciar e finalizar atendimento conectados ao backend.
* Administrador/painel web: fluxo de desistência deve permitir oferecer o horário vago para cliente posterior, gerando mensagem de disponibilidade para antecipar.
* Administrador/backend: bloqueios e folgas (`TimeOff`) criados, listados e removidos; slots disponiveis respeitam bloqueios.

### Pendente para concluir a fase

* Validar fluxo ponta a ponta em ambiente rodando com banco.

### Validacao

* Backend `type-check`, `lint:check`, `build` e `test`: OK.
* Web `type-check`, `build` e `lint`: OK.
* Mobile `flutter analyze` e `flutter test`: OK.

## Fase 4 - Notificacoes

### Status inicial

* Mobile: `firebase_core` e `firebase_messaging` adicionados.
* Mobile: token FCM registrado no backend após login/cadastro/restauração de sessão quando Firebase estiver configurado.
* Backend: `DeviceToken` criado no Prisma com migration.
* Backend: endpoint `POST /notifications/device-token` criado.
* Backend: eventos de agendamento criado, confirmado e cancelado registram notificação push em fila.
* Documentação criada em `mobile/docs/FIREBASE_FCM_SETUP.md`.

### Implementado nesta etapa

* Backend: `firebase-admin` integrado para envio real via FCM quando houver credencial.
* Backend: `@nestjs/schedule` configurado para processar notificações agendadas.
* Backend: lembretes automáticos de 24h e 1h antes do agendamento.
* Backend: reagendamento recria lembretes pendentes.
* Backend: cancelamento remove lembretes pendentes.
* Backend: tokens FCM inválidos são desativados automaticamente quando o Firebase retorna erro de token.
* Backend: suporta `FIREBASE_SERVICE_ACCOUNT_JSON` em JSON/base64 e `GOOGLE_APPLICATION_CREDENTIALS`.
* Mobile Android: plugin `com.google.gms.google-services` preparado de forma condicional.
* Mobile Android: permissão `POST_NOTIFICATIONS` adicionada para Android 13+.
* Documentação FCM atualizada com o fluxo Android/backend real.

### Validacao de codigo

* Backend `type-check`, `lint:check`, `build` e `test`: OK.
* Mobile `flutter analyze` e `flutter test`: OK.

### Pendente para concluir a fase

* Criar projeto Firebase real.
* Adicionar `mobile/android/app/google-services.json`.
* Configurar `FIREBASE_SERVICE_ACCOUNT_JSON` ou `GOOGLE_APPLICATION_CREDENTIALS` no backend.
* Validar push Android em aparelho/emulador.

## Fase 5 - Loja Online

### Observacao de sequencia

* A Fase 4 segue com validacao real de push Android pendente por depender de Firebase externo.
* Por autorizacao do usuario, a implementacao de codigo da Fase 5 foi continuada sem remover essa pendencia.

### Implementado

* Banco: `ProductFavorite` criado com migration para favoritos de produtos.
* Backend: `StoreModule` criado com catalogo, carrinho, favoritos, checkout e historico.
* Backend: checkout cria `Order`, `OrderItem`, `Payment` pendente e `StockMovement`.
* Backend: estoque e validado antes da compra e baixado no checkout.
* Backend: endpoint administrativo `GET /store/admin/orders` criado para painel web.
* Mobile: tela de loja adicionada com produtos, favoritos, carrinho, checkout Pix pendente e pedidos.
* Mobile: rota `/app/store` ligada ao atalho "Comprar produtos".
* Web: pagina Lojinha mostra pedidos recentes e metricas de pedidos.

### Validacao

* Backend `prisma:generate`, `type-check`, `lint:check`, `build` e `test`: OK.
* Web `type-check`, `lint` e `build`: OK.
* Mobile `flutter analyze` e `flutter test`: OK.

### Pendente operacional

* Aplicar migrations em banco real.
* Cadastrar produtos reais com estoque e imagens.
* Testar compra ponta a ponta com backend e banco rodando.

## Fase 6 - Pagamentos

### Implementado

* Backend: SDK oficial `mercadopago` instalado.
* Backend: variáveis Mercado Pago adicionadas ao `.env.example` e à validação de ambiente.
* Banco: índice único `Payment(provider, providerReference)` adicionado.
* Banco: `PaymentWebhookEvent` criado para idempotência de webhooks.
* Backend: `PaymentsModule` criado com Checkout Pro, webhook, consulta de status, cancelamento e estorno.
* Backend: webhook Mercado Pago valida `x-signature` com o validador oficial do SDK.
* Backend: webhook consulta o pagamento no Mercado Pago antes de alterar pedido interno.
* Backend: checkout da loja agora reserva estoque por 30 minutos e cria preferência Checkout Pro.
* Backend: pagamento aprovado confirma `Payment=PAID`, `Order=PAID` e consome reserva com movimento `OUT`.
* Backend: pagamento rejeitado/cancelado/expirado cancela pedido, cancela pagamento e libera reserva com movimento `RELEASE`.
* Backend: job de reconciliação cancela/libera pagamentos pendentes vencidos quando webhook não chegar.
* Backend: estorno total/parcial para `OWNER` e `ADMIN`, com motivo, auditoria e reposição opcional de estoque.
* Mobile: `url_launcher` e `app_links` adicionados.
* Mobile: checkout abre a URL do Mercado Pago em navegador externo.
* Mobile: deep link `barbeariadoartur://payments/result` configurado no Android.
* Mobile: retorno do pagamento consulta `/payments/orders/:orderId/status` e atualiza histórico.
* Web: painel Lojinha exibe status do pagamento e ação de estorno com valor, motivo e reposição opcional.

### Validacao de codigo

* Backend `prisma:generate`, `type-check`, `lint:check`, `build` e `test`: OK.
* Backend testes de pagamentos adicionados: aprovação consome reserva; rejeição libera reserva.
* Web `type-check`, `lint` e `build`: OK.
* Mobile `flutter analyze` e `flutter test`: OK.

### Pendente externo

* Configurar `MERCADO_PAGO_ACCESS_TOKEN` sandbox.
* Configurar `MERCADO_PAGO_WEBHOOK_SECRET`.
* Configurar `MERCADO_PAGO_WEBHOOK_URL` público apontando para `/api/payments/webhooks/mercado-pago`.
* Testar compra Pix sandbox aprovada.
* Testar cartão sandbox aprovado e recusado.
* Confirmar recebimento real do webhook.
* Confirmar estorno real no Mercado Pago.
