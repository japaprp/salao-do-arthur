# Manual de operação — Barbearia do Artur

> **Versão de homologação.** Este manual descreve as telas e regras encontradas no código. Só deve ser entregue como manual definitivo depois dos testes ponta a ponta e do treinamento acompanhado.

## 1. Acesso

O Artur usa somente o site administrativo que será fornecido na entrega. Não precisa acessar GitHub, Render, banco de dados, terminal ou configurações técnicas.

- **Criar a primeira conta do proprietário:** tela de onboarding administrativo (/auth/register/admin). Informar nome da barbearia, nome do responsável, e-mail, senha e confirmação.
- **Entrar:** /auth/login.
- Usar uma senha exclusiva e não compartilhá-la. Cada pessoa da equipe deve ter sua própria conta e permissões adequadas.

## 2. O que aparece no menu

- **Dashboard:** visão rápida da agenda, receita prevista, clientes e ticket médio.
- **Agendamentos:** agenda visual, fila de decisões, criação de horários e bloqueios/folgas.
- **Clientes:** cadastro, histórico e recursos de pontos/cashback.
- **Profissionais:** equipe, serviços vinculados e ajustes de preço/duração.
- **Serviços:** catálogo, duração, preço e intervalos antes/depois do atendimento.
- **Lojinha:** produtos, estoque e pedidos.
- **Financeiro:** receitas, despesas, comissões e resultado do período.
- **Relatórios:** indicadores de atendimentos, serviços, produtos e recorrência.
- **Perfil do Artur:** dados da barbearia e opções de operação.

## 3. Configuração inicial

Antes de abrir a agenda ao público:

1. Entre em **Perfil do Artur** e confira nome, razão social, descrição, telefone, WhatsApp e e-mail.
2. Configure os canais públicos da barbearia, se forem utilizados.
3. Em **Serviços**, cadastre cada serviço com nome, duração e preço corretos. Revise também os intervalos antes/depois e se o serviço está ativo.
4. Em **Profissionais**, cadastre a equipe e associe cada profissional aos serviços que realmente executa. Confira eventuais preços e durações personalizados.
5. Em **Agendamentos**, registre bloqueios e folgas. **A configuração da jornada semanal recorrente por profissional ainda não tem tela administrativa.** A janela provisória de agendamento está fixa das 09h às 19h, todos os dias; folgas e bloqueios podem ser registrados separadamente. Se o horário real da barbearia ou de algum profissional for diferente, não abra a agenda ao público até a equipe técnica configurar e homologar a regra correta.
6. Oriente os clientes a criarem sua conta pelo aplicativo; os cadastros aparecem no painel conforme forem realizados.
7. Se usar a Lojinha, cadastre produtos e confira quantidades físicas antes de ativar o catálogo.

## 4. Rotina diária da agenda

1. Abra **Agendamentos** e confira a data selecionada.
2. Veja os horários ocupados e livres na agenda visual.
3. Para criar um horário, use a ação de adicionar agendamento/encaixe e informe cliente, profissional, serviço, data, horário e observações.
4. Confira o nome do cliente, profissional, serviço e horário antes de salvar.
5. A seção **Pedidos para o Artur decidir** reúne solicitações que precisam de confirmação, ajuste de horário ou contato.
6. Para folgas e bloqueios, informe profissional, título, início, fim e motivo.
7. Atualize o status do atendimento conforme ele acontece: agendado, chegada/check-in, em atendimento e concluído.

**Importante:** concluir um atendimento registra sua receita e comissão no fluxo financeiro. Não lance novamente o mesmo atendimento como receita manual.

## 5. Clientes e relacionamento

Em **Clientes**, consulte a ficha e os saldos de pontos/cashback. Alterações manuais de pontos ou cashback devem ter motivo registrado e ser feitas somente quando autorizadas.

O aplicativo móvel é voltado ao cliente: cadastro/entrada, início, agendamentos, loja e perfil. O painel web é a ferramenta administrativa do Artur.

## 6. Produtos e estoque

Em **Lojinha**:

- Confira nome, preço de venda, custo e quantidade física.
- Marque se o produto está ativo, em destaque e disponível para venda.
- Ative o controle de estoque apenas quando a quantidade cadastrada estiver correta.
- Revise os alertas de reposição e os pedidos recentes.

Ao devolver um produto ao estoque depois de um estorno, marque **Devolver itens ao estoque** somente se os itens realmente retornaram e foram conferidos.

## 7. Financeiro

Em **Financeiro**, selecione o período e confira receitas, despesas, comissões e lucro.

O bloco **Lançamento rápido** serve para registrar uma receita ou despesa manual que ainda não esteja registrada por outro fluxo. Informe tipo, categoria, valor e descrição.

- Não lance manualmente uma receita de atendimento já concluído.
- Não registre duas vezes a mesma venda ou despesa.
- A taxa de cancelamento tardio exibida no sistema é apenas sugerida; **não é cobrada automaticamente**. Combine qualquer cobrança com o cliente e registre o recebimento somente quando ele realmente ocorrer.
- O painel apresenta resumo financeiro; ele não substitui conciliação bancária ou fechamento contábil.

## 8. Pagamentos e estornos

O checkout online deve permanecer desligado até que a integração Mercado Pago esteja configurada e testada pela equipe técnica. A API exige também uma liberação técnica explícita no servidor (`MERCADO_PAGO_CHECKOUT_READY=true`), que deve permanecer `false` até a homologação. Não tente ativá-lo por conta própria.

Se um estorno for necessário, abra **Lojinha**, localize o pedido e use a ação de estorno disponível para o pagamento. Em seguida:

1. Confirme o pagamento e o pedido corretos.
2. Informe o valor (deixe vazio somente quando a intenção for estorno total) e o motivo.
3. Marque devolução ao estoque somente quando os itens tiverem sido devolvidos.
4. Aguarde o status do provedor. Um pedido de estorno em processamento ainda não significa que o dinheiro foi devolvido.

**Nunca clique repetidamente para tentar resolver uma cobrança ou estorno pendente.** Confira o status e peça suporte antes de repetir a operação.

## 9. O que o Artur não deve fazer

- Não compartilhar senha nem usar a conta de outra pessoa.
- Não ativar checkout sem liberação técnica.
- Não duplicar receitas de atendimentos concluídos.
- Não ajustar estoque sem contar os produtos.
- Não prometer cobrança automática de taxa de cancelamento.
- Não repetir pagamentos ou estornos que estejam pendentes.
- Não tentar restaurar banco, alterar configurações de hospedagem ou fazer manutenção técnica.

## 10. Limites conhecidos antes da entrega

A homologação ainda precisa comprovar, em ambiente isolado e com dados de teste:

- cadastro e primeiro acesso do proprietário;
- configuração da jornada semanal por profissional e validação dos dias de funcionamento;
- criação, alteração, confirmação, conclusão e cancelamento de agendamentos;
- cálculo e conferência do financeiro e comissões;
- fluxo de produtos, estoque, pedido e estorno;
- login e permissões de cada perfil;
- uso em celular e computador;
- backup e restauração.

O fechamento diário de caixa, a cobrança automática de taxa de cancelamento e a ativação do checkout não devem ser prometidos como recursos operacionais até serem implementados e homologados.

---

**Regra de suporte:** se algo parecer errado, pare antes de repetir a operação, anote a tela, o horário e o que estava tentando fazer e peça ajuda à pessoa responsável pela implantação.
