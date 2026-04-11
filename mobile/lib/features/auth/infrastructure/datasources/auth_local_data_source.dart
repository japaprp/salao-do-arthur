import 'package:shared_preferences/shared_preferences.dart';
import 'package:salao_da_lu_mobile/core/storage/app_storage_keys.dart';
import 'package:salao_da_lu_mobile/features/auth/infrastructure/models/auth_session_model.dart';
import 'package:salao_da_lu_mobile/features/auth/infrastructure/models/auth_user_model.dart';

class AuthLocalDataSource {
  const AuthLocalDataSource(this._sharedPreferences);

  final SharedPreferences _sharedPreferences;

  AuthSessionModel? readSession() {
    final accessToken =
        _sharedPreferences.getString(AppStorageKeys.accessToken);
    final tokenType = _sharedPreferences.getString(AppStorageKeys.tokenType);
    final expiresIn = _sharedPreferences.getString(AppStorageKeys.expiresIn);
    final email = _sharedPreferences.getString(AppStorageKeys.userEmail);
    final userId = _sharedPreferences.getString(AppStorageKeys.userId);
    final role = _sharedPreferences.getString(AppStorageKeys.userRole);
    final tenantId = _sharedPreferences.getString(AppStorageKeys.tenantId);

    if (accessToken == null ||
        tokenType == null ||
        expiresIn == null ||
        email == null ||
        userId == null ||
        role == null ||
        tenantId == null) {
      return null;
    }

    return AuthSessionModel(
      accessToken: accessToken,
      tokenType: tokenType,
      expiresIn: expiresIn,
      user: AuthUserModel.fromStorage(
        {
          'id': userId,
          'email': email,
          'role': role,
          'tenantId': tenantId,
          'name': _sharedPreferences.getString(AppStorageKeys.userName) ?? '',
        },
      ),
    );
  }

  Future<void> saveSession(AuthSessionModel session) async {
    final userStorage = session.user.toStorage();
    await _sharedPreferences.setString(
      AppStorageKeys.accessToken,
      session.accessToken,
    );
    await _sharedPreferences.setString(
      AppStorageKeys.tokenType,
      session.tokenType,
    );
    await _sharedPreferences.setString(
      AppStorageKeys.expiresIn,
      session.expiresIn,
    );
    await _sharedPreferences.setString(
      AppStorageKeys.userId,
      userStorage['id'] ?? '',
    );
    await _sharedPreferences.setString(
      AppStorageKeys.userEmail,
      userStorage['email'] ?? '',
    );
    await _sharedPreferences.setString(
      AppStorageKeys.userRole,
      userStorage['role'] ?? '',
    );
    await _sharedPreferences.setString(
      AppStorageKeys.tenantId,
      userStorage['tenantId'] ?? '',
    );
    await _sharedPreferences.setString(
      AppStorageKeys.userName,
      userStorage['name'] ?? '',
    );
  }

  Future<void> clearSession() async {
    await _sharedPreferences.remove(AppStorageKeys.accessToken);
    await _sharedPreferences.remove(AppStorageKeys.tokenType);
    await _sharedPreferences.remove(AppStorageKeys.expiresIn);
    await _sharedPreferences.remove(AppStorageKeys.userId);
    await _sharedPreferences.remove(AppStorageKeys.userEmail);
    await _sharedPreferences.remove(AppStorageKeys.userRole);
    await _sharedPreferences.remove(AppStorageKeys.tenantId);
    await _sharedPreferences.remove(AppStorageKeys.userName);
  }
}
