import 'package:salao_da_lu_mobile/core/result/result.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/entities/auth_session.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/repositories/auth_repository.dart';

class RestoreSessionUseCase {
  const RestoreSessionUseCase(this._repository);

  final AuthRepository _repository;

  Result<AuthSession?> call() {
    return _repository.restoreSession();
  }
}
