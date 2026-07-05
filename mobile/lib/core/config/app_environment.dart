import 'package:flutter/foundation.dart';

class AppEnvironment {
  AppEnvironment._();

  static const String localApiBaseUrl = 'http://localhost:3100/api';
  static const String androidEmulatorApiBaseUrl = 'http://10.0.2.2:3100/api';
  static const String configuredApiBaseUrl = String.fromEnvironment('API_BASE_URL');

  static String get apiBaseUrl {
    if (configuredApiBaseUrl.isNotEmpty) {
      return _validateConfiguredApiBaseUrl(configuredApiBaseUrl);
    }

    if (kReleaseMode) {
      throw StateError(
        'API_BASE_URL precisa ser informado no build de release. '
        'Use --dart-define=API_BASE_URL=https://sua-api.com/api',
      );
    }

    if (kIsWeb) {
      return localApiBaseUrl;
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return androidEmulatorApiBaseUrl;
      default:
        return localApiBaseUrl;
    }
  }

  static String _validateConfiguredApiBaseUrl(String value) {
    final uri = Uri.tryParse(value);
    if (uri == null || !uri.hasScheme || !uri.hasAuthority) {
      throw StateError('API_BASE_URL invalida: $value');
    }

    if (kReleaseMode && uri.scheme != 'https') {
      throw StateError('API_BASE_URL de release precisa usar HTTPS.');
    }

    return value;
  }
}
