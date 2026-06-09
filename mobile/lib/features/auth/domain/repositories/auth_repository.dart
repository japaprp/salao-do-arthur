import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/entities/auth_session.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/entities/register_command.dart';

abstract interface class AuthRepository {
  Future<Result<AuthSession?>> restoreSession();

  Future<Result<AuthSession>> signIn({
    required String tenantSubdomain,
    required String email,
    required String password,
  });

  Future<Result<AuthSession>> register(RegisterCommand command);

  Future<Result<void>> forgotPassword({
    required String tenantSubdomain,
    required String email,
  });

  Future<void> signOut();
}
