import 'package:barbearia_do_artur_mobile/core/network/api_client.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/entities/auth_session.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

class FcmRegistrationService {
  const FcmRegistrationService(this._apiClient);

  final ApiClient _apiClient;

  Future<void> registerForSession(AuthSession session) async {
    try {
      await Firebase.initializeApp();
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission();
      final token = await messaging.getToken();
      if (token == null || token.isEmpty) {
        return;
      }

      await _apiClient.post(
        '/notifications/device-token',
        accessToken: session.accessToken,
        data: {
          'token': token,
          'platform': defaultTargetPlatform == TargetPlatform.iOS
              ? 'ios'
              : defaultTargetPlatform == TargetPlatform.android
                  ? 'android'
                  : 'web',
        },
      );
    } catch (_) {
      // Firebase is optional until the Android google-services.json is configured.
    }
  }
}
