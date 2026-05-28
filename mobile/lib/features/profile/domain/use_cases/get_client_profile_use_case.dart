import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/profile/domain/entities/client_profile.dart';
import 'package:barbearia_do_artur_mobile/features/profile/domain/repositories/profile_repository.dart';

class GetClientProfileUseCase {
  const GetClientProfileUseCase(this._repository);

  final ProfileRepository _repository;

  Future<Result<ClientProfile>> call(String accessToken) {
    return _repository.getClientProfile(accessToken);
  }
}
