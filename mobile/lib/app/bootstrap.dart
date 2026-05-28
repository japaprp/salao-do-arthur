import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:barbearia_do_artur_mobile/app/app.dart';
import 'package:barbearia_do_artur_mobile/app/observers/app_provider_observer.dart';
import 'package:barbearia_do_artur_mobile/core/storage/shared_preferences_provider.dart';

Future<void> bootstrap() async {
  WidgetsFlutterBinding.ensureInitialized();
  final sharedPreferences = await SharedPreferences.getInstance();

  runApp(
    ProviderScope(
      observers: const [AppProviderObserver()],
      overrides: [
        sharedPreferencesProvider.overrideWithValue(sharedPreferences),
      ],
      child: const BarbeariaDoArturApp(),
    ),
  );
}
