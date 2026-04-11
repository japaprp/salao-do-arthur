import 'package:salao_da_lu_mobile/core/result/result.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/entities/auth_session.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/entities/register_command.dart';

abstract interface class AuthRepository {
  Result<AuthSession?> restoreSession();

  Future<Result<AuthSession>> signIn({
    required String tenantSubdomain,
    required String email,
    required String password,
  });

  Future<Result<AuthSession>> register(RegisterCommand command);

  Future<void> signOut();
}
