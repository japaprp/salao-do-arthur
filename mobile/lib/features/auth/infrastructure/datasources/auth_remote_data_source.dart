import 'package:salao_da_lu_mobile/core/errors/app_exception.dart';
import 'package:salao_da_lu_mobile/core/network/api_client.dart';
import 'package:salao_da_lu_mobile/core/network/api_endpoints.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/entities/register_command.dart';
import 'package:salao_da_lu_mobile/features/auth/infrastructure/models/auth_session_model.dart';
import 'package:salao_da_lu_mobile/features/auth/infrastructure/models/auth_user_model.dart';

class AuthRemoteDataSource {
  const AuthRemoteDataSource(this._apiClient);

  final ApiClient _apiClient;

  Future<AuthSessionModel> signIn({
    required String tenantSubdomain,
    required String email,
    required String password,
  }) async {
    final loginResponse = await _apiClient.post(
      ApiEndpoints.authLogin,
      data: {
        'tenantSubdomain': tenantSubdomain,
        'email': email,
        'password': password,
      },
    );

    final accessToken = loginResponse['accessToken'] as String? ?? '';
    final refreshToken = loginResponse['refreshToken'] as String? ?? '';
    final tokenType = loginResponse['tokenType'] as String? ?? 'Bearer';
    final expiresIn = '${loginResponse['expiresIn'] ?? ''}';

    if (accessToken.isEmpty || refreshToken.isEmpty) {
      throw const AppException(
        message: 'Resposta de login invalida.',
      );
    }

    final profileResponse = await _apiClient.get(
      ApiEndpoints.authProfile,
      accessToken: accessToken,
    );

    return AuthSessionModel(
      accessToken: accessToken,
      refreshToken: refreshToken,
      tokenType: tokenType,
      expiresIn: expiresIn,
      user: AuthUserModel.fromProfile(profileResponse),
    );
  }

  Future<AuthSessionModel> register(RegisterCommand command) async {
    await _apiClient.post(
      ApiEndpoints.authRegister,
      data: {
        'name': command.name,
        'email': command.email,
        'password': command.password,
        'tenantSubdomain': command.tenantSubdomain,
      },
    );

    return signIn(
      tenantSubdomain: command.tenantSubdomain,
      email: command.email,
      password: command.password,
    );
  }

  Future<void> signOut(String accessToken) async {
    await _apiClient.post(
      ApiEndpoints.authLogout,
      accessToken: accessToken,
    );
  }
}
