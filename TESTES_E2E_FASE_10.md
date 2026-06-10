# Testes E2E - Fase 10

## Escopo obrigatorio

Ambiente necessario:

* Backend com banco de homologacao atualizado.
* Web apontando para o backend de homologacao.
* App Flutter apontando para o backend de homologacao.
* Firebase configurado quando validar push.
* Mercado Pago sandbox configurado quando validar pagamento.

## Fluxos

### Cadastro

1. Criar conta de cliente no app.
2. Confirmar login automatico ou login manual.
3. Confirmar criacao do cliente em `GET /clients/me`.

### Login

1. Entrar com email e senha validos.
2. Confirmar armazenamento seguro de tokens no app.
3. Forcar refresh token e confirmar sessao renovada.

### Agendamento

1. Selecionar servico.
2. Selecionar profissional.
3. Escolher horario disponivel.
4. Confirmar agendamento.
5. Reagendar.
6. Cancelar.

### Compra

1. Abrir lojinha.
2. Adicionar produto ao carrinho.
3. Confirmar reserva de estoque.
4. Criar pedido pendente.

### Pagamento

1. Abrir Checkout Pro.
2. Pagar com Pix sandbox aprovado.
3. Pagar com cartao sandbox aprovado.
4. Pagar com cartao sandbox recusado.
5. Confirmar webhook recebido.
6. Confirmar pedido aprovado/cancelado.
7. Confirmar movimento correto de estoque.
8. Executar estorno total e parcial no painel.

## Evidencias esperadas

* Prints do app e painel.
* IDs de pedido, pagamento e webhook.
* Logs do backend sem stack trace.
* Movimentos de estoque correspondentes.
* Auditoria para estorno, cancelamento e ajustes criticos.
