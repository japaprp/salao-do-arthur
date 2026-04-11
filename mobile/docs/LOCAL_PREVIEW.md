# Preview local do app Flutter

O ambiente local ja reconhece estes devices:

- `windows`
- `chrome`
- `edge`

## VS Code

Na raiz do projeto, abra a aba `Run and Debug` e escolha uma das configuracoes:

- `Flutter Windows`
- `Flutter Chrome`
- `Flutter Edge`

Isso executa o app da pasta `mobile/` com hot reload.

## Terminal

```bash
cd mobile
flutter run -d windows
```

ou

```bash
cd mobile
flutter run -d chrome
```

## Quando usar cada modo

- `Windows`: melhor para validar layout e fluxo rapido no desktop
- `Chrome` ou `Edge`: melhor para inspecionar UI, responsividade e debug visual
- `Celular`: deixar para validacao final de gesto, performance real e hardware

## Observacao

O disco `C:` esta com espaco muito baixo. Isso nao impediu o reconhecimento dos devices nem o `flutter analyze`, mas pode atrapalhar builds maiores.
