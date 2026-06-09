import 'package:dio/dio.dart';
import 'package:barbearia_do_artur_mobile/core/errors/app_exception.dart';
import 'package:barbearia_do_artur_mobile/core/errors/failure.dart';
import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/entities/auth_session.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/entities/register_command.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:barbearia_do_artur_mobile/features/auth/infrastructure/datasources/auth_local_data_source.dart';
import 'package:barbearia_do_artur_mobile/features/auth/infrastructure/datasources/auth_remote_data_source.dart';

class AuthRepositoryImpl implements AuthRepository {
  const AuthRepositoryImpl({
    required AuthRemoteDataSource remoteDataSource,
    required AuthLocalDataSource localDataSource,
  })  : _remoteDataSource = remoteDataSource,
        _localDataSource = localDataSource;

  final AuthRemoteDataSource _remoteDataSource;
  final AuthLocalDataSource _localDataSource;

  @override
  Future<Result<AuthSession?>> restoreSession() async {
    try {
      final session = await _localDataSource.readSession();
      return Success(session?.toEntity());
    } catch (error) {
      return const FailureResult(
        Failure(message: 'Nao foi possivel restaurar a sessao local.'),
      );
    }
  }

  @override
  Future<Result<AuthSession>> signIn({
    required String tenantSubdomain,
    required String email,
    required String password,
  }) async {
    try {
      final session = await _remoteDataSource.signIn(
        tenantSubdomain: tenantSubdomain,
        email: email,
        password: password,
      );
      await _localDataSource.saveSession(session);
      return Success(session.toEntity());
    } catch (error) {
      return FailureResult(_mapFailure(error));
    }
  }

  @override
  Future<Result<AuthSession>> register(RegisterCommand command) async {
    try {
      final session = await _remoteDataSource.register(command);
      await _localDataSource.saveSession(session);
      return Success(session.toEntity());
    } catch (error) {
      return FailureResult(_mapFailure(error));
    }
  }

  @override
  Future<Result<void>> forgotPassword({
    required String tenantSubdomain,
    required String email,
  }) async {
    try {
      await _remoteDataSource.forgotPassword(
        tenantSubdomain: tenantSubdomain,
        email: email,
      );
      return const Success(null);
    } catch (error) {
      return FailureResult(_mapFailure(error));
    }
  }

  @override
  Future<void> signOut() async {
    final session = await _localDataSource.readSession();

    try {
      if (session != null) {
        await _remoteDataSource.signOut(session.accessToken);
      }
    } on DioException {
      // A limpeza local da sessão tem precedência sobre falha remota de logout.
    } finally {
      await _localDataSource.clearSession();
    }
  }

  Failure _mapFailure(Object error) {
    if (error is DioException) {
      final responseData = error.response?.data;
      final backendMessage =
          responseData is Map<String, dynamic> ? responseData['message'] : null;
      return Failure(
        message:
            backendMessage?.toString() ?? 'Falha de comunicacao com a API.',
        code: '${error.response?.statusCode ?? 'network'}',
      );
    }

    if (error is AppException) {
      return Failure(
        message: error.message,
        code: '${error.statusCode ?? 'app'}',
      );
    }

    return const Failure(
      message: 'Falha inesperada durante a autenticacao.',
    );
  }
}
