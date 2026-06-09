import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/profile/domain/entities/client_profile.dart';
import 'package:barbearia_do_artur_mobile/features/profile/domain/repositories/profile_repository.dart';

class RedeemLoyaltyPointsUseCase {
  const RedeemLoyaltyPointsUseCase(this._repository);

  final ProfileRepository _repository;

  Future<Result<ClientProfile>> call({
    required String accessToken,
    required int points,
    required String reason,
  }) {
    return _repository.redeemPoints(
      accessToken: accessToken,
      points: points,
      reason: reason,
    );
  }
}
