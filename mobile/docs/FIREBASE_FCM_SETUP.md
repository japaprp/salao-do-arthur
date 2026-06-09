# Firebase Cloud Messaging Setup

Esta fase prepara o app para push Android, mas o envio real depende de configuração no Firebase Console.

## Arquivos necessários

1. Criar projeto no Firebase Console.
2. Adicionar app Android com package:
   `com.barbeariadoartur.barbearia_do_artur_mobile`
3. Baixar `google-services.json`.
4. Colocar em:
   `mobile/android/app/google-services.json`

## Android

* O plugin `com.google.gms.google-services` já está declarado no Gradle.
* O plugin só é aplicado quando `mobile/android/app/google-services.json` existe, para não quebrar builds locais sem credencial.
* A permissão `android.permission.POST_NOTIFICATIONS` já está declarada para Android 13+.

## Backend

Configurar uma das variáveis em ambiente seguro:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

ou

```env
GOOGLE_APPLICATION_CREDENTIALS=C:\secure\firebase-service-account.json
```

Nunca commitar credenciais Firebase no repositório.

## Fluxo implementado

* App solicita permissão de notificação.
* App coleta o token FCM.
* App registra o token em `POST /notifications/device-token`.
* Backend registra notificações de agendamento criado, confirmado e cancelado.
* Backend envia push real via Firebase Admin SDK quando houver credencial.
* Backend agenda lembretes automáticos de 24h e 1h antes do atendimento.
* Sem credenciais Firebase, o backend mantém a notificação em fila/log e não tenta expor segredo.
