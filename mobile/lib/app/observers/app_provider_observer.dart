import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final class AppProviderObserver extends ProviderObserver {
  const AppProviderObserver();

  @override
  void didUpdateProvider(
    ProviderObserverContext context,
    Object? previousValue,
    Object? newValue,
  ) {
    assert(() {
      final providerName =
          context.provider.name ?? context.provider.runtimeType;
      debugPrint('[riverpod] $providerName updated');
      return true;
    }());
  }
}
