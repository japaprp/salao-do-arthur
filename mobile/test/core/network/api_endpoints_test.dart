import 'package:flutter_test/flutter_test.dart';
import 'package:barbearia_do_artur_mobile/core/network/api_endpoints.dart';

void main() {
  test('appointments available slots endpoint serializes the date-only query',
      () {
    final endpoint = ApiEndpoints.appointmentsAvailableSlots(
      serviceId: 'service-1',
      professionalId: 'professional-1',
      date: DateTime(2026, 5, 12, 14, 30),
    );

    expect(
      endpoint,
      '/appointments/available-slots?serviceId=service-1&professionalId=professional-1&date=2026-05-12',
    );
  });
}
