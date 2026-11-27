# Checklist de prontidão — Salão do Arthur

Este checklist é interno. Não marcar PASS sem evidência reproduzível. Os estados possíveis são PASS, FAIL, BLOCKED e NOT RUN.

| Etapa | Escopo | Estado atual |
|---|---|---|
| 1 | Auditoria completa de código, dependências, arquitetura e configuração | BLOCKED — inventário parcial; npm ci reportou 36 vulnerabilidades (13 altas e 2 críticas); relatório npm audit detalhado e triagem ainda pendentes |
| 2 | Segurança, autenticação, autorização e isolamento entre tenants | BLOCKED — endurecimento implementado na branch; CI e auditoria de todos os caminhos ainda pendentes |
| 3 | Integridade do banco, transações, concorrência e migrações | BLOCKED — migrações adicionadas; execução contra MySQL isolado e preflight de dados reais não executados |
| 4 | Pagamentos, webhooks, estornos e idempotência | BLOCKED — correções implementadas; sandbox Mercado Pago e concorrência real não executados |
| 5 | Financeiro, receitas, despesas, comissões e conciliação | BLOCKED — correção de dupla contagem e unicidade implementadas; conciliação e fechamento de caixa não homologados |
| 6 | Agenda, profissionais, horários e cancelamentos | BLOCKED — código e proteção de concorrência presentes; jornada semanal recorrente não possui tela administrativa e a janela provisória está fixa em 09h–19h todos os dias; fluxo ponta a ponta não homologado |
| 7 | Clientes, histórico, pontos e notificações | NOT RUN — validação completa pendente |
| 8 | Painel administrativo e permissões por perfil | NOT RUN — teste com contas separadas pendente |
| 9 | Web e aplicativo móvel, responsividade e acessibilidade | NOT RUN — teste em dispositivos reais pendente |
| 10 | Automações, lembretes e recuperação de falhas | NOT RUN — teste integrado pendente |
| 11 | Infraestrutura, domínio, HTTPS, banco e variáveis | BLOCKED — Render/Pages identificados; MySQL externo, domínio, segredos e capacidade contratada não verificados |
| 12 | Backups, restauração, monitoramento e recuperação | BLOCKED — não há evidência de restauração real |
| 13 | Publicação controlada e rollback | BLOCKED — workflows protegidos; publicação e rollback não executados |
| 14 | Homologação final e simulação de operação | NOT RUN — exige ambiente isolado, sandbox e dispositivo real |
| 15 | Treinamento, manual e entrega assistida | BLOCKED — manual preliminar criado; treinamento e aceite do Arthur não realizados |

## Evidências e decisões desta branch

- Branch de trabalho: fix/release-readiness-20261127.
- A main não recebeu as correções do produto; houve um arquivo de teste criado e removido por engano, com registro de inclusão e reversão no histórico. Conteúdo final da main foi verificado sem esse arquivo.
- O npm ci do backend reportou 36 vulnerabilidades: 1 baixa, 20 moderadas, 13 altas e 2 críticas. A etapa npm audit foi adicionada ao CI em modo relatório; nenhuma atualização de dependência foi aplicada sem triagem.
- Nenhum merge, deploy ou publicação foi executado.
- O CI já identificou e permitiu corrigir uma expectativa de teste desatualizada; tipagem/build passaram em uma execução anterior, mas o teste de cancelamento falhou naquela execução.
- Uma nova validação completa precisa rodar sobre o HEAD mais recente antes de classificar o conjunto de correções como PASS.
- O manual operacional é preliminar e não deve ser tratado como aceite de produção.

## Critérios de liberação

1. Todas as etapas 1–14 devem ter evidência PASS, ou exceções documentadas e aceitas formalmente pelo responsável.
2. Nenhum FAIL aberto em isolamento entre tenants, agenda, pagamentos, estornos, estoque ou integridade financeira.
3. Banco MySQL persistente, TLS, backups automáticos e restauração comprovada.
4. Checkout desligado até sandbox, webhooks e conciliação aprovados.
5. Manual validado com Arthur em sessão assistida; ele deve conseguir operar os fluxos sem terminal ou acesso técnico.
6. Publicação somente após autorização específica para go-live.
