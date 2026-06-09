import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/profile/domain/entities/client_profile.dart';

abstract interface class ProfileRepository {
  Future<Result<ClientProfile>> getClientProfile(String accessToken);

  Future<Result<ClientProfile>> redeemPoints({
    required String accessToken,
    required int points,
    required String reason,
  });
}
