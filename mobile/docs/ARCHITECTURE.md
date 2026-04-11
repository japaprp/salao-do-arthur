# Mobile Architecture

## Status do Ambiente

- Flutter SDK funcional em `C:\Users\Yago Fellipe Amorim\flutter`
- Dart funcional
- `flutter doctor -v` sem issues no Windows, Android, Chrome e Edge
- Bloqueio remanescente: disco `C:` praticamente sem folga para upgrade do SDK

## Princípios Aplicados

- Feature-First
- Clean Architecture
- arquivos pequenos e responsabilidade única
- foundation antes de feature visual ampla
- integração progressiva com backend real

## Estrutura Atual

```text
mobile/
├── android/
├── web/
├── windows/
├── docs/
│   └── ARCHITECTURE.md
├── lib/
│   ├── app/
│   │   ├── navigation/
│   │   ├── observers/
│   │   ├── screens/
│   │   ├── app.dart
│   │   └── bootstrap.dart
│   ├── core/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── errors/
│   │   ├── network/
│   │   ├── result/
│   │   ├── storage/
│   │   └── utils/
│   ├── shared/
│   │   └── design_system/
│   │       ├── theme/
│   │       └── widgets/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── application/
│   │   │   ├── domain/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── appointments/
│   │   │   ├── application/
│   │   │   ├── domain/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── profile/
│   │   │   ├── application/
│   │   │   ├── domain/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   └── home/
│   │       └── presentation/
│   └── main.dart
└── test/
```

## Estrutura-Alvo do App Cliente

```text
lib/features/
├── auth/
├── appointments/
├── catalog/
├── checkout/
├── loyalty/
├── notifications/
└── profile/
```

Cada feature deve seguir o mesmo formato:

```text
feature_x/
├── application/
├── domain/
├── infrastructure/
└── presentation/
```

## Decisões Arquiteturais

### State Management

Foi escolhido `flutter_riverpod` porque combina bem com:

- injeção explícita de dependências
- leitura clara entre camadas
- testabilidade sem acoplamento a `BuildContext`
- crescimento modular por feature

### Navegação

Foi escolhido `go_router` para:

- centralizar rotas
- permitir redirect por estado de auth/onboarding
- preparar guards por sessão e tenant

### Networking

Foi criado um `ApiClient` com `dio` para:

- centralizar `baseUrl`
- permitir autenticação por bearer token
- abrir caminho para interceptors, retry e observabilidade

### Persistência Local

Foi usado `shared_preferences` na foundation para:

- flag de onboarding
- persistência inicial de sessão

Trade-off:
para token sensível, o ideal de produção é migrar depois para `flutter_secure_storage`.

### Design System

Foi criada uma base simples em `shared/design_system` com:

- tokens de cor, espaçamento e raio
- tema global
- widgets básicos reutilizáveis

O objetivo nesta fase não é acabamento final, e sim consistência estrutural.

## Primeira Feature Implementada

A primeira feature definida foi `Auth/Onboarding`, conforme solicitado:

- onboarding guiado
- sign in
- sign up
- persistência local de sessão
- redirect inicial por onboarding + auth

Observação:
a `home` atual existe apenas como destino autenticado de transição para validar navegação protegida e sessão restaurada. Ela não substitui a próxima implementação feature-first de negócio.

## Feature Transacional Entregue

`appointments` passou a ser a primeira feature transacional do cliente:

- carrega serviços ativos do tenant
- carrega profissionais disponíveis por serviço
- sugere slots disponíveis por serviço + profissional + data
- lista os agendamentos do cliente autenticado
- cria agendamento via endpoint self-service sem expor `clientId`, `price` ou `duration`

## Feature de Relacionamento Entregue

`profile` passa a centralizar a visão do cliente logado:

- perfil do cliente autenticado via `GET /clients/me`
- fidelidade com pontos acumulados, saldo da carteira e movimentações recentes
- histórico de atendimentos e próxima visita
- navegação protegida separada da `home`

## Integração com Backend

O login usa os endpoints reais:

- `POST /auth/login`
- `GET /auth/profile`

O cadastro usa:

- `POST /auth/register`

O contrato atual do mobile usa:

- `tenantSubdomain` como código público do salão no login e no cadastro
- criação automática do registro `Client` no backend quando o papel é `CLIENT`

## Trade-offs Atuais

### Fase 0: Ambiente

- O ambiente real está funcional.
- O SDK não foi atualizado porque o disco está sem espaço suficiente.

Risco:
atualizações futuras do Flutter podem falhar até liberar espaço em `C:`.

### Fase 1: Foundation

- A foundation já está pronta para crescer por feature.
- Ainda não há interceptors, analytics, secure storage nem flavoring.

Risco:
se várias features forem adicionadas sem reforçar observabilidade e segurança local, o custo de retrofit sobe.

### Fase 2: Auth/Onboarding

- O login e o cadastro do cliente já usam `tenantSubdomain`, o que reduz atrito frente ao `tenantId` cru.
- O backend cria o `Client` automaticamente durante o registro do cliente.

Risco:
o fluxo ainda depende do cliente conhecer o código do salão.
O ideal depois é ter descoberta por convite, QR code, link mágico ou seleção assistida.
