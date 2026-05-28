import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/entities/auth_session.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/entities/register_command.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/repositories/auth_repository.dart';

class RegisterUseCase {
  const RegisterUseCase(this._repository);

  final AuthRepository _repository;

  Future<Result<AuthSession>> call(RegisterCommand command) {
    return _repository.register(command);
  }
}
