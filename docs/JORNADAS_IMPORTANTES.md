# Jornadas prioritárias — Salão do Arthur

**Branch de trabalho:** `fix/release-readiness-20261127`  
**PR:** #2 (draft)  
**Objetivo:** transformar as funções existentes em jornadas completas, previsíveis e testáveis para cliente, profissional e proprietário.  
**Regra de evidência:** tela, rota, hook ou módulo existente não equivale a jornada aprovada. PASS exige execução reproduzível de ponta a ponta; quando depende de serviço real, conta, dispositivo ou decisão do Arthur, marcar BLOCKED ou NOT RUN.

## 1. Escopo e ordem de prioridade

| Prioridade | Jornada | Perfil principal | Estado inicial |
|---|---|---|---|
| P0 | Primeiro acesso e configuração segura do salão | Proprietário | PARTIAL / validação operacional pendente |
| P0 | Entrar, recuperar senha e encerrar sessão | Todos | PARTIAL / autenticação web cross-site bloqueada |
| P0 | Consultar disponibilidade e agendar | Cliente | PARTIAL / agenda existe; jornada pública ponta a ponta não comprovada |
| P0 | Confirmar, remarcar e cancelar | Cliente + proprietário | PARTIAL / ações administrativas identificadas; E2E não executado |
| P0 | Abrir agenda do dia e conduzir atendimento | Profissional | PARTIAL / estados check-in, iniciar e concluir presentes no painel web; superfície profissional dedicada não comprovada |
| P0 | Receber pagamento e fechar caixa | Proprietário/operador | BLOCKED / checkout desligado; sandbox e conciliação não homologados |
| P1 | Cadastrar cliente e consultar histórico | Proprietário/operador | PARTIAL / tela de clientes existe; fluxo integral e permissões não homologados |
| P1 | Administrar serviços, profissionais e horários | Proprietário | PARTIAL / cadastros existem; horário semanal por profissional ausente |
| P1 | Vender produto, controlar pedido e estoque | Cliente + operador | PARTIAL / loja e módulos existem; compra real não homologada |
| P1 | Fidelizar e reter clientes | Proprietário + cliente | PARTIAL / pontos e resgate aparecem no painel; ciclo integral não testado |
| P1 | Lembretes, notificações e falhas de entrega | Sistema + operador | NOT RUN / integração real e retries não homologados |
| P0 | Recuperar operação após falha | Proprietário/equipe técnica | BLOCKED / backup e restauração reais não comprovados |

## 2. Jornadas detalhadas e critérios de aceite

### J01 — Primeiro acesso e configuração do salão (P0)
1. Proprietário acessa a rota de cadastro inicial autorizada.
2. Sistema cria o usuário proprietário e o tenant correto.
3. Proprietário confirma e-mail/credenciais conforme mecanismo disponível.
4. Configura nome, contato, fuso horário, moeda e dados públicos do salão.
5. Cadastra serviços, duração, preço, profissionais e permissões.
6. Configura horários semanais, intervalos, folgas e feriados.
7. Visualiza uma prévia da agenda e confirma que horários indisponíveis não podem ser reservados.

**Aceite:** tenant isolado; apenas proprietário autorizado administra configurações; nenhum dado demonstrativo em produção; horários persistidos e respeitados pela API.  
**Lacunas conhecidas:** manual preliminar aponta `/auth/register/admin`; não executar cadastro em produção durante esta etapa.

### J02 — Entrar, recuperar senha e sair (P0)
1. Usuário informa credenciais.
2. API valida identidade, estado da conta e tenant.
3. Frontend recebe sessão sem persistir access token em armazenamento inseguro.
4. Recarregar a página restaura sessão pelo mecanismo de refresh.
5. Usuário solicita recuperação; recebe instrução por canal configurado.
6. Token de redefinição é validado, usado uma única vez e expira.
7. Usuário redefine senha, encerra sessão e não consegue reutilizar refresh token revogado.

**Aceite:** erros não revelam se um e-mail existe; rate limit; cookies e CORS funcionam nos navegadores-alvo; sessão revogada não é restaurada.  
**Bloqueio conhecido:** GitHub Pages + API Render são cross-site e o cookie `SameSite=Lax` não sustenta com segurança a renovação descrita. Preferir frontend e API sob o mesmo domínio próprio; homologar antes do go-live.

### J03 — Cliente descobre serviços e agenda (P0)
1. Cliente abre a página pública.
2. Consulta serviços ativos, duração, preço e profissionais elegíveis.
3. Escolhe serviço, profissional (ou opção disponível), data e horário.
4. Sistema apresenta apenas slots realmente disponíveis, considerando expediente, duração, intervalos, bloqueios e agendamentos existentes.
5. Cliente autentica ou conclui cadastro sem perder a seleção.
6. Confirma os dados e envia a reserva.
7. API valida novamente a disponibilidade e cria a reserva de forma transacional.
8. Cliente recebe confirmação e consegue consultar o agendamento.

**Aceite:** nenhuma reserva fora do expediente; nenhuma sobreposição; duas requisições concorrentes para o mesmo slot resultam em no máximo uma reserva; preço e duração vêm do serviço vigente no servidor, não de valores manipuláveis no cliente.  
**Lacunas:** o painel administrativo cria agendamentos e o smoke concorrente MySQL passou; a jornada pública cliente → slot → reserva → confirmação não foi comprovada ponta a ponta.

### J04 — Confirmar, remarcar e cancelar (P0)
1. Cliente ou operador abre o agendamento correto.
2. Sistema verifica titularidade, tenant, papel e janela de cancelamento.
3. Remarcação consulta disponibilidade e reserva o novo slot atomicamente.
4. Cancelamento aplica política e registra motivo, ator e horário.
5. Slot liberado volta a ficar disponível.
6. Cliente e profissional recebem atualização quando o canal estiver homologado.

**Aceite:** usuário não altera reserva de outro cliente/tenant; não há duplicação nem perda silenciosa; política de cancelamento é explícita; histórico preserva estado anterior e ator.  
**Lacunas:** hooks administrativos de edição/cancelamento estão presentes em `web/src/pages/appointments.tsx`; E2E cliente e autorização por perfil ainda não executados.

### J05 — Agenda do profissional e atendimento (P0)
1. Profissional entra com conta e permissões próprias.
2. Visualiza somente a agenda permitida, com horário, serviço e dados mínimos do cliente.
3. Confere presença e faz check-in.
4. Inicia atendimento; estado e horário ficam registrados.
5. Registra serviço executado e observações estritamente necessárias.
6. Finaliza atendimento; sistema impede finalização duplicada.
7. Atendimento concluído segue para pagamento/caixa e histórico.

**Aceite:** profissional não acessa financeiro ou dados administrativos sem permissão; transições inválidas são recusadas; início/fim têm trilha de auditoria; finalização repetida é idempotente.  
**Lacunas:** o painel web de agenda tem ações de check-in, início e conclusão; área profissional dedicada e testes em conta real de profissional não estão comprovados.

### J06 — Pagamento, comissão e fechamento de caixa (P0)
1. Operador abre atendimento concluído e confere itens/valores.
2. Seleciona método de pagamento habilitado.
3. Sistema cria cobrança/registro idempotente.
4. Quando externo, provedor confirma por webhook assinado; retorno do navegador não é prova de pagamento.
5. Caixa registra receita uma única vez e calcula comissão conforme regra vigente.
6. Estorno exige autorização, motivo e referência original.
7. Fechamento compara saldo esperado com transações, taxas, estornos e dinheiro informado.
8. Relatório de divergências fica disponível antes de confirmar o fechamento.

**Aceite:** pagamento não pode ser duplicado por retry; webhook inválido é rejeitado; estorno não excede saldo elegível; conciliação rastreável; fechamento não altera histórico.  
**Bloqueio conhecido:** checkout está desativado por padrão (`MERCADO_PAGO_CHECKOUT_READY=false`); sandbox, credenciais, webhook externo e conciliação real não foram homologados. Não ativar checkout nesta etapa.

### J07 — Cadastro, busca e histórico do cliente (P1)
1. Operador autorizado cadastra ou localiza cliente.
2. Sistema evita duplicidade com regra de identificação apropriada.
3. Atualiza dados com validação e consentimento quando aplicável.
4. Consulta histórico de agendamentos e atendimentos.
5. Registra preferências/anotações apenas quando necessárias e com acesso restrito.
6. Corrige dados e atende solicitações de acesso/exportação/exclusão conforme política aplicável.

**Aceite:** minimização de dados; busca não expõe clientes de outro tenant; alterações críticas são auditadas; dados sensíveis não aparecem em logs.  
**Evidência existente:** `web/src/pages/clients.tsx` consome clientes e operações de fidelidade; fluxo completo de privacidade e permissões ainda precisa ser testado.

### J08 — Serviços, profissionais e expediente (P1)
1. Proprietário cria/edita serviço, categoria, preço e duração.
2. Vincula serviços aos profissionais habilitados.
3. Define expediente semanal por profissional, intervalos e exceções.
4. Registra folgas, férias, feriados e bloqueios pontuais.
5. Sistema recalcula slots futuros sem alterar reservas já confirmadas indevidamente.
6. Proprietário testa um dia comum e uma exceção antes de publicar disponibilidade.

**Aceite:** API é fonte da verdade; intervalos e duração são respeitados; alteração não cria sobreposição; mudanças futuras preservam agendamentos existentes ou exigem remarcação assistida.  
**Bloqueio conhecido:** o schema Prisma já possui o modelo `WorkingHour` (dia da semana, início/fim, intervalo e vínculo opcional ao profissional), mas a auditoria desta branch não encontrou integração desse modelo ao motor de disponibilidade nem tela administrativa para configurá-lo. O motor de agenda ainda usa constantes 09h–19h e intervalo de 30 minutos. Portanto, não tratar o expediente semanal como funcional.

### J09 — Loja, pedido e estoque (P1)
1. Cliente consulta apenas produtos ativos e disponíveis.
2. Adiciona item ao carrinho e confere preço/quantidade.
3. Sistema revalida preço e estoque no servidor ao confirmar.
4. Pedido é criado com itens e valores imutáveis para histórico.
5. Pagamento é confirmado pelo provedor quando aplicável.
6. Estoque é baixado uma única vez; cancelamento/estorno segue política de reposição.
7. Cliente acompanha status e operador trata exceções.

**Aceite:** estoque nunca fica negativo por concorrência; pedido não é duplicado por retry; preço não pode ser alterado no cliente; status e movimentações são auditáveis.  
**Lacunas:** página cliente consome catálogo e pedidos; compra ponta a ponta, integração de pagamento e estoque real não foram homologados.

### J10 — Fidelidade e retenção (P1)
1. Atendimento elegível é concluído e liquidado.
2. Pontos/cashback são calculados uma única vez conforme regra publicada.
3. Cliente consulta saldo e extrato.
4. Resgate valida saldo, validade e elegibilidade.
5. Cancelamento/estorno reverte benefício proporcionalmente, sem apagar histórico.
6. Operador visualiza motivo e trilha de ajuste manual.

**Aceite:** ledger imutável; saldo derivado de transações; ajustes exigem motivo e permissão; retry não credita pontos em duplicidade.  
**Evidência existente:** painel de clientes expõe ações de resgate/ajuste; ciclo completo com pagamento e estorno não foi validado.

### J11 — Lembretes e notificações (P1)
1. Evento elegível é gerado (criação, confirmação, cancelamento e lembretes).
2. Preferências e consentimento do destinatário são verificados.
3. Mensagem é enfileirada com chave idempotente.
4. Worker tenta entrega pelo canal habilitado.
5. Falha transitória usa retry limitado; falha permanente é registrada sem loop.
6. Operador consulta status sem ver tokens ou conteúdo sensível desnecessário.

**Aceite:** não duplicar mensagens; respeitar opt-out; logs com status e correlação; fila recuperável após reinício.  
**Estado:** NOT RUN — entrega real, templates, consentimento, retries e observabilidade ainda não homologados.

### J12 — Backup, restauração e contingência (P0)
1. Backup automático e externo é produzido em frequência definida.
2. Integridade do artefato é verificada por checksum e retenção.
3. Restauração é feita em banco isolado.
4. Equipe valida schema, contagens, integridade referencial e acesso.
5. Registra RPO/RTO observado e plano de comunicação.
6. Só então aprova janela de manutenção/rollback.

**Aceite:** restauração demonstrada, não apenas backup existente; acesso restrito; segredos fora do artefato; procedimento repetível.  
**Bloqueio conhecido:** ainda não há evidência de backup externo e restore real.

## 3. Matriz de testes ponta a ponta

| ID | Cenário positivo | Cenário negativo/abuso | Concorrência/idempotência | Evidência exigida |
|---|---|---|---|---|
| J01 | Provisionar tenant e proprietário em ambiente descartável | Cadastro não autorizado / seed em produção | Duplo envio de cadastro | API + banco + log de auditoria |
| J02 | Login, refresh, recuperação e logout | Senha inválida, token expirado/reutilizado, origem não permitida | Dois refresh simultâneos | Teste API + browser nos domínios finais |
| J03 | Reservar slot livre | Slot fechado, serviço inativo, dados adulterados | Duas reservas no mesmo slot | E2E cliente + MySQL |
| J04 | Remarcar e cancelar dentro da política | Acesso a reserva alheia / fora da janela | Duas remarcações para o mesmo slot | E2E + trilha de auditoria |
| J05 | Check-in, início e conclusão | Transição inválida / papel indevido | Duplo clique na conclusão | E2E profissional + banco |
| J06 | Pagamento aprovado e fechamento | Webhook inválido, pagamento recusado, estorno não elegível | Webhook repetido e estorno simultâneo | Sandbox + conciliação |
| J07 | Cadastrar e consultar histórico | IDOR/BOLA e acesso entre tenants | Cadastro duplicado | E2E + testes de autorização |
| J08 | Configurar expediente e exceção | Slot fora do expediente | Alteração concorrente de agenda | API + UI + teste de conflito |
| J09 | Comprar produto disponível | Estoque insuficiente e preço adulterado | Duas compras da última unidade | E2E + ledger de estoque |
| J10 | Creditar e resgatar pontos | Saldo insuficiente e ajuste sem permissão | Crédito/resgate repetido | Testes de ledger + E2E |
| J11 | Entregar lembrete | Opt-out, canal indisponível | Retry e reprocessamento | Worker + provedor de teste |
| J12 | Restaurar backup íntegro | Checksum inválido e backup incompleto | Backup durante gravações | Restore isolado + relatório RPO/RTO |

## 4. Regras transversais obrigatórias

- **Autorização:** validar papel, tenant e titularidade no backend em toda operação; ocultar botão na UI não é controle de acesso.
- **Integridade:** preço, duração, disponibilidade, saldo, comissão e estoque são recalculados/validados no servidor.
- **Idempotência:** operações financeiras, reservas, estoque, pontos e notificações precisam de proteção contra repetição.
- **Auditoria:** registrar ator, tenant, entidade, ação, horário, correlação e motivo quando aplicável; nunca registrar senha, token ou dados pessoais desnecessários.
- **Estados de interface:** cada passo precisa ter carregamento, vazio, sucesso, erro recuperável e erro definitivo.
- **Acessibilidade:** navegação por teclado, foco visível, rótulos, contraste, mensagens de validação e leitores de tela precisam ser testados em execução real.
- **Privacidade:** coletar somente os dados necessários; limitar acesso por função; definir retenção e atendimento de solicitações do titular.
- **Resiliência:** timeout, retry limitado, prevenção de duplicidade e reconciliação para integrações externas.

## 5. Evidência atual versus validação pendente

### Evidência já disponível no histórico desta branch
- **PASS:** smoke MySQL descartável aplicou 12 migrações, executou seed/healthcheck e comprovou conflito concorrente de agendamento (uma reserva aceita e outra recusada).
- **PASS:** backend no commit de validação registrado no PR: type-check, lint, build e 86 testes.
- **PASS:** web no commit de validação registrado no PR: type-check, lint, build e 11 testes.
- **PASS:** mobile no commit de validação registrado no PR: analyze e 3 testes; 34 mensagens informativas de depreciação ainda existem.
- **FAIL:** gate de dependências encontrou vulnerabilidades altas/críticas em backend e web.
- **BLOCKED:** autenticação web cross-site na topologia GitHub Pages + Render com cookie SameSite=Lax.
- **BLOCKED:** Mercado Pago sandbox/produção, banco real, backup/restore, expediente semanal e isolamento relacional/SQL bruto.
- **NOT RUN:** E2E completo por perfil, testes em dispositivos reais, acessibilidade, notificações reais e treinamento/aceite do Arthur.

**Importante:** as evidências PASS acima pertencem aos commits de validação identificados no PR e não substituem uma nova execução completa no HEAD atual. Não são prova de jornada ponta a ponta.

## 6. Plano de execução recomendado

1. Corrigir dependências altas/críticas e obter CI + security gate PASS.
2. Completar autorização multi-tenant e testes negativos/IDOR/BOLA.
3. Integrar o modelo `WorkingHour` ao motor de disponibilidade, criar gestão semanal por profissional e fechar J03/J04/J08.
4. Implementar/validar J05 com conta profissional e transições auditadas.
5. Fechar J06 em sandbox, conciliação e estornos sem ativar checkout de produção.
6. Fechar J07/J09/J10 com testes de privacidade, estoque e ledger.
7. Homologar J02 em domínio same-site, com browser real.
8. Implementar e provar J11/J12.
9. Executar E2E web/mobile e acessibilidade em dispositivos reais.
10. Fazer treinamento assistido e obter aceite do Arthur.

## 7. Critério de conclusão do conjunto

As jornadas P0 precisam estar PASS antes de operação real. Jornadas P1 devem estar PASS antes de habilitar os respectivos módulos. Qualquer BLOCKED em segurança, isolamento, agenda, pagamento, financeiro, backup ou recuperação impede go-live. O PR continua draft; não fazer merge, deploy, publicação ou ativação de checkout como consequência automática deste documento.
