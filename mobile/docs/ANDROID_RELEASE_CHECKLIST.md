# Android release checklist

Estado atual do projeto mobile:

- `applicationId` definido: `com.barbeariadoartur.barbearia_do_artur_mobile`
- build de `release` ainda usa chave de debug
- nome exibido do app definido: `Barbearia do Artur`
- icones e branding ainda estao no padrao gerado pelo Flutter
- ainda nao existe configuracao de ambiente de producao para API

## Proximo passo imediato

Fechar a identidade de release Android:

1. definir o `applicationId` final
2. definir nome publico do app
3. trocar icones e splash
4. configurar assinatura de release

Sem isso, nao faz sentido gerar pacote para Play Store.

## O que precisa ficar pronto antes do upload

### 1. Identidade do app

- ajustar `applicationId` em `android/app/build.gradle.kts`
- ajustar `android:label` em `android/app/src/main/AndroidManifest.xml`
- substituir `ic_launcher` por icones finais
- alinhar package Kotlin se o `applicationId` mudar

### 2. Assinatura e build release

- criar keystore de producao
- configurar `key.properties`
- parar de usar `debug` em `buildTypes.release`
- gerar `AAB` com `flutter build appbundle`

### 3. Ambiente de producao

- definir URL real da API
- separar config de `dev` e `prod`
- validar CORS e headers do backend para o dominio final

### 4. Politicas e compliance

- politica de privacidade publica
- formulario de Data safety na Play Console
- revisar permissoes Android efetivamente usadas
- revisar coleta de dados, autenticacao e armazenamento local

### 5. Qualidade minima

- fluxo real de cadastro/login
- fluxo real de agendamento
- tratamento de erro e loading
- testes em Android fisico
- revisao de performance e crash

### 6. Materiais da Play Store

- descricao curta e longa
- screenshots reais
- icone 512x512
- feature graphic
- classificacao de conteudo
- faixa etaria e categoria

## Ordem recomendada

1. branding Android e assinatura
2. integrar auth real com backend
3. implementar agendamento real
4. configurar ambiente de producao
5. gerar AAB
6. subir em teste interno fechado
7. corrigir feedback
8. preparar listagem final da Play Store
