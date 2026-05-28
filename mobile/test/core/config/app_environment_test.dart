import 'package:flutter_test/flutter_test.dart';
import 'package:barbearia_do_artur_mobile/core/config/app_environment.dart';

void main() {
  test('api base urls include the backend api prefix', () {
    expect(AppEnvironment.localApiBaseUrl, endsWith('/api'));
    expect(AppEnvironment.androidEmulatorApiBaseUrl, endsWith('/api'));
  });
}
