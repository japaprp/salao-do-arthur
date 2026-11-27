# Produção — Barbearia do Artur

## Arquitetura ativa identificada no repositório

- **Web:** Next.js exportado estaticamente para GitHub Pages.
- **API:** NestJS hospedado no Render, descrito em `render.yaml`.
- **Banco:** MySQL externo, fornecido por um serviço separado e configurado em `DATABASE_URL`.
- **Domínio/API pública:** configurar `NEXT_PUBLIC_API_URL` nas variáveis do repositório GitHub e `CORS_ORIGINS` no Render.

O procedimento Nginx/systemd não é o caminho ativo descrito pelos workflows e pelo Blueprint do Render. Não misturar as duas topologias na mesma implantação.

## Barreiras de publicação

- O Render Blueprint usa `autoDeployTrigger: off`: commits não devem publicar automaticamente.
- O workflow do GitHub Pages é manual (`workflow_dispatch`) e só aceita execução a partir de `main`.
- Não executar publicação antes da homologação, backup verificável e aprovação operacional.
- O seed demonstrativo não deve ser executado em produção. A variável `ALLOW_DEMO_SEED` deve permanecer `false`.
- O workflow self-hosted `deploy-production.yml` é uma alternativa separada e só pode ser executado a partir de `main`.

## Variáveis obrigatórias da API

Configurar no Render, sem colocar valores secretos no Git:

- `DATABASE_URL`: conexão MySQL de produção com TLS conforme o provedor.
- `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `PASSWORD_RESET_SECRET`: três segredos distintos, aleatórios e com pelo menos 32 caracteres.
- `CORS_ORIGINS`: origens HTTPS exatas do frontend publicado.
- `WEB_APP_URL`: URL pública da aplicação.
- `NODE_ENV=production`.
- `TRUST_PROXY_HOPS`: número de saltos de proxy confiáveis; o Blueprint Render declara `1`, mas confirme a topologia real do provedor antes da liberação. Não aumentar esse valor sem verificar os proxies intermediários.
- `ALLOW_DEMO_SEED=false`.

O processo de inicialização valida os segredos e rejeita placeholders. Não reutilizar credenciais de desenvolvimento ou CI.

## Mercado Pago

O checkout deve permanecer desativado até que todos os itens abaixo estejam configurados e testados:

- Access token da conta correta.
- Segredo de assinatura do webhook.
- `MERCADO_PAGO_CHECKOUT_READY=true` configurado somente pela equipe técnica depois da homologação integral; o padrão deve permanecer `false`.
- URL pública HTTPS do webhook.
- Fluxo de pagamento aprovado, recusado, expirado e estornado no sandbox.
- Repetição e concorrência de webhooks sem duplicar baixa de estoque, receita ou estorno.
- Conciliação entre pagamentos no provedor e registros internos.

As credenciais vazias no Blueprint significam que o checkout ainda não está pronto para produção. Não ativar `enableCheckout` antes disso.

## Banco, backup e migrações

1. Confirmar que o MySQL externo é persistente, tem backups automáticos e TLS.
2. Fazer backup antes de qualquer migração de produção.
3. Executar o SQL somente-leitura `ops/preflight/financial-appointment-duplicates.sql`; se retornar linhas, interromper e reconciliar os lançamentos manualmente sem apagar histórico.
4. Verificar o status das migrações e comparar schema com o banco.
5. Aplicar apenas migrações aditivas e compatíveis com a versão atualmente em produção.
6. Validar healthcheck `/api/health/ready` e os fluxos principais.
7. Testar restauração em banco isolado; um arquivo de backup sem teste de restauração não comprova recuperabilidade.

A implantação não deve apagar ou sobrescrever dados do banco. Rollback de código não reverte automaticamente migrações.

## Primeiro acesso e configuração do salão

O seed demonstrativo não é um procedimento de provisionamento de produção. Criar o primeiro proprietário pelo fluxo de cadastro de administrador, confirmar que o tenant e as configurações padrão são criados, depois configurar nome, contato, serviços, profissionais, horários e permissões. Testar recuperação de senha e acesso do proprietário antes de abrir o agendamento público.

## Critério para go-live

Não liberar o salão enquanto houver qualquer item BLOCKED em segurança, isolamento entre tenants, agenda, financeiro, pagamento, backup/restauração, disponibilidade ou treinamento. O plano gratuito do provedor, disponibilidade do MySQL, domínio, custos, limites e comportamento de suspensão precisam ser confirmados com as contas reais antes da decisão comercial.

## Alternativa self-hosted

O diretório `ops/nginx` e os workflows `deploy-production.yml` / `rollback-production.yml` descrevem uma implantação Linux própria. Ela exige servidor, domínio, TLS, MySQL, systemd, backup e secrets próprios. Não usar essa alternativa sem decisão explícita e infraestrutura provisionada.
