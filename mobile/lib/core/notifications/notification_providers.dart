import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barbearia_do_artur_mobile/core/network/api_client.dart';
import 'package:barbearia_do_artur_mobile/core/notifications/fcm_registration_service.dart';

final fcmRegistrationServiceProvider = Provider<FcmRegistrationService>((ref) {
  return FcmRegistrationService(ref.watch(apiClientProvider));
});
