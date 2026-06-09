import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:barbearia_do_artur_mobile/app/app.dart';
import 'package:barbearia_do_artur_mobile/core/storage/shared_preferences_provider.dart';

void main() {
  testWidgets('shows onboarding on first launch', (tester) async {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
    final sharedPreferences = await SharedPreferences.getInstance();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(sharedPreferences),
        ],
        child: const BarbeariaDoArturApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.text('Seu horario no jeito certo.'),
      findsOneWidget,
    );
    expect(find.text('Proximo passo'), findsOneWidget);
  });
}
