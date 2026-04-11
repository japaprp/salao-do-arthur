import 'package:salao_da_lu_mobile/core/result/result.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/entities/auth_session.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/repositories/auth_repository.dart';

class SignInUseCase {
  const SignInUseCase(this._repository);

  final AuthRepository _repository;

  Future<Result<AuthSession>> call({
    required String tenantSubdomain,
    required String email,
    required String password,
  }) {
    return _repository.signIn(
      tenantSubdomain: tenantSubdomain,
      email: email,
      password: password,
    );
  }
}
