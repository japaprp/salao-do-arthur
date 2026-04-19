import 'package:flutter/foundation.dart';

class AppEnvironment {
  AppEnvironment._();

  static const String localApiBaseUrl = 'http://localhost:3100/api';
  static const String androidEmulatorApiBaseUrl = 'http://10.0.2.2:3100/api';

  static String get apiBaseUrl {
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
}
