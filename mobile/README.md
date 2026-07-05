# Mobile Barbearia do Artur

Base Flutter do app cliente estruturada conforme Feature-First + Clean Architecture.

## App entregue

- ambiente Flutter/Dart validado
- projeto Flutter regenerado com `android/`, `web/` e `windows/`
- estrutura em `app/`, `core`, `shared` e `features`
- navigation com `go_router`
- state management com `flutter_riverpod`
- networking base com `dio`
- persistencia local inicial com `shared_preferences`
- primeira feature implementada: `auth`
- primeira feature transacional do cliente: `appointments`
- motor inicial de slots reais para agendamento por cliente
- nova feature de `profile/fidelidade` integrada ao backend
- `home` autenticada com agenda, pacote mensal e atalhos do cliente
- auth do cliente usando `codigo da Barbearia do Artur` (`tenantSubdomain`) em vez de `tenantId` bruto

## Documentacao principal

- arquitetura: `docs/ARCHITECTURE.md`
- preview local: `docs/LOCAL_PREVIEW.md`
- release Android: `docs/ANDROID_RELEASE_CHECKLIST.md`

## Executar localmente

```bash
flutter pub get
flutter run -d windows
```

ou

```bash
flutter run -d chrome
```

## Build real

Para release, informe a API pública por `dart-define`:

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://sua-api.com/api
```

Build de release sem `API_BASE_URL` falha de propósito para não enviar app apontando para localhost.

## Observacao importante

O disco `C:` esta praticamente sem espaco. O ambiente atual funciona, mas upgrades do Flutter e downloads maiores podem falhar ate haver limpeza de espaco.
