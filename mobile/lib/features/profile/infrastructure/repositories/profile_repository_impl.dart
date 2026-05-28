import 'package:dio/dio.dart';
import 'package:barbearia_do_artur_mobile/core/errors/app_exception.dart';
import 'package:barbearia_do_artur_mobile/core/errors/failure.dart';
import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/profile/domain/entities/client_profile.dart';
import 'package:barbearia_do_artur_mobile/features/profile/domain/repositories/profile_repository.dart';
import 'package:barbearia_do_artur_mobile/features/profile/infrastructure/datasources/profile_remote_data_source.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  const ProfileRepositoryImpl(this._remoteDataSource);

  final ProfileRemoteDataSource _remoteDataSource;

  @override
  Future<Result<ClientProfile>> getClientProfile(String accessToken) async {
    try {
      final profile = await _remoteDataSource.getClientProfile(accessToken);
      return Success(profile.toEntity());
    } catch (error) {
      return FailureResult(_mapFailure(error));
    }
  }

  Failure _mapFailure(Object error) {
    if (error is DioException) {
      final responseData = error.response?.data;
      final backendMessage =
          responseData is Map<String, dynamic> ? responseData['message'] : null;
      return Failure(
        message: backendMessage?.toString() ??
            'Falha ao carregar o perfil do cliente.',
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
      message: 'Falha inesperada ao carregar o perfil.',
    );
  }
}
