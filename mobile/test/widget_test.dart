import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:salao_da_lu_mobile/app/app.dart';
import 'package:salao_da_lu_mobile/core/storage/shared_preferences_provider.dart';

void main() {
  testWidgets('shows onboarding on first launch', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final sharedPreferences = await SharedPreferences.getInstance();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(sharedPreferences),
        ],
        child: const SalaoDaLuApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.text('Foundation primeiro, experiencia depois.'),
      findsOneWidget,
    );
    expect(find.text('Proximo passo'), findsOneWidget);
  });
}
