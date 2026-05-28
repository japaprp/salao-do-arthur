import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/repositories/auth_repository.dart';

class ForgotPasswordUseCase {
  const ForgotPasswordUseCase(this._repository);

  final AuthRepository _repository;

  Future<Result<void>> call({
    required String tenantSubdomain,
    required String email,
  }) {
    return _repository.forgotPassword(
      tenantSubdomain: tenantSubdomain,
      email: email,
    );
  }
}
