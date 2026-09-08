# Barbearia do Artur

Base web + backend + mobile para operacao de barbearia.

## Objetivo

Evoluir a base para um produto vertical reutilizavel para barbearias, com agenda confiavel, atendimento, clientes, financeiro e experiencia consistente entre web e mobile.

## Setup local sem Docker

1. Inicie o `MySQL` no XAMPP.
2. Crie o banco `barbearia_dev`.
3. No backend:

```powershell
cd backend
npx prisma db push
npm run prisma:seed
npm run start:dev
```

4. No web:

```powershell
cd web
npm run dev
```

5. No mobile Flutter:

```powershell
cd mobile
flutter run -d windows
```

Endpoints locais:

- backend: `http://localhost:3100/api`
- web: `http://localhost:3001`

---

# Roadmap de producao real

## 1. Agenda

- [ ] Agenda por profissional
- [ ] Horarios de trabalho e disponibilidade
- [ ] Bloqueios, folgas e feriados
- [ ] Criacao, confirmacao, cancelamento e remarcacao
- [ ] Regra contra conflito de horarios no banco e na API
- [ ] No-show e historico de comparecimento
- [ ] Lista de espera quando fizer sentido
- [ ] Testes de concorrencia: dois usuarios tentando o mesmo horario

## 2. Atendimento

- [ ] Check-in do cliente
- [ ] Atendimento iniciado/finalizado
- [ ] Registro do servico executado
- [ ] Vinculo correto entre profissional, servico e agendamento
- [ ] Alteracao/cancelamento com trilha de auditoria
- [ ] Fechamento sem duplicidade

## 3. Clientes e historico

- [ ] Cadastro e busca
- [ ] Historico de atendimentos
- [ ] Preferencias/anotacoes quando aplicavel
- [ ] Protecao de dados pessoais
- [ ] Exportacao/exclusao quando aplicavel
- [ ] Permissoes para dados de clientes

## 4. Financeiro

- [ ] Caixa
- [ ] Pagamentos
- [ ] Comissoes
- [ ] Fechamento
- [ ] Cancelamento/estorno
- [ ] Relatorios
- [ ] Transacoes atomicas
- [ ] Idempotencia em operacoes de pagamento

## 5. Seguranca e permissoes

- [ ] Autenticacao revisada
- [ ] RBAC por papel
- [ ] Testes de acesso indevido/IDOR/BOLA
- [ ] Validacao de entrada
- [ ] Protecao de sessoes/tokens
- [ ] Rate limiting em endpoints sensiveis
- [ ] Segredos fora do repositorio
- [ ] Logs sem senha/token/PII desnecessaria

## 6. Web + mobile

- [ ] Mesmas regras de negocio nos dois clientes
- [ ] Tratamento consistente de erros
- [ ] Loading/vazio/sucesso/falha
- [ ] Offline apenas onde houver comportamento definido
- [ ] Testes em dispositivo real
- [ ] Responsividade web

## 7. Testes e robustez

- [ ] Testes unitarios
- [ ] Testes de API
- [ ] Testes de agenda/conflito
- [ ] Testes de autorizacao
- [ ] Testes de atendimento
- [ ] Testes financeiros
- [ ] E2E dos fluxos principais
- [ ] Testes de concorrencia
- [ ] Testes de regressao

## 8. Observabilidade e recuperacao

- [ ] Logs estruturados
- [ ] Health check
- [ ] Monitoramento de erros
- [ ] Auditoria de operacoes criticas
- [ ] Backup automatico
- [ ] Teste real de restauracao
- [ ] Rollback documentado
- [ ] Plano de contingencia

## 9. Produto comercial

- [ ] Cadastro de nova barbearia sem alterar codigo
- [ ] Configuracoes por negocio
- [ ] Identidade visual configuravel
- [ ] Planos e limites quando houver SaaS
- [ ] Onboarding
- [ ] Manual do administrador
- [ ] Manual do operador
- [ ] Checklist de go-live
- [ ] Processo de atualizacao sem interromper clientes

## Criterio de pronto

So considerar o produto pronto quando o fluxo **agendamento -> atendimento -> pagamento -> fechamento -> historico** estiver funcionando ponta a ponta, com seguranca, testes, tratamento de conflitos, backup e observabilidade adequados.

## Deploy de producao

Consulte `PRODUCTION_DEPLOYMENT.md` para o procedimento de producao.

## Regra de continuidade

Antes de adicionar novas telas ou efeitos, priorizar:

**seguranca -> integridade da agenda/financeiro -> testes -> recuperacao -> observabilidade -> UX -> productizacao.**
