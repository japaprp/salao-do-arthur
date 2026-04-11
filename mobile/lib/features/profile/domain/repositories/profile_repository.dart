import 'package:salao_da_lu_mobile/core/result/result.dart';
import 'package:salao_da_lu_mobile/features/profile/domain/entities/client_profile.dart';

abstract interface class ProfileRepository {
  Future<Result<ClientProfile>> getClientProfile(String accessToken);
}
