# Mobile Salao da Lu

Base Flutter do app cliente estruturada conforme Feature-First + Clean Architecture.

## Foundation entregue

- ambiente Flutter/Dart validado
- projeto Flutter regenerado com `android/`, `web/` e `windows/`
- foundation em `app/`, `core/`, `shared/` e `features/`
- navigation com `go_router`
- state management com `flutter_riverpod`
- networking base com `dio`
- persistencia local inicial com `shared_preferences`
- primeira feature implementada: `auth`
- primeira feature transacional do cliente: `appointments`
- motor inicial de slots reais para agendamento por cliente
- nova feature de `profile/fidelidade` integrada ao backend
- `home` autenticada criada apenas como placeholder de navegacao protegida
- auth do cliente usando `codigo do salao` (`tenantSubdomain`) em vez de `tenantId` bruto

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

## Observacao importante

O disco `C:` esta praticamente sem espaco. O ambiente atual funciona, mas upgrades do Flutter e downloads maiores podem falhar ate haver limpeza de espaco.
