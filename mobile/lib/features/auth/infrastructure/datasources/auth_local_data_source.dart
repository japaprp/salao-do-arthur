import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:barbearia_do_artur_mobile/core/storage/app_storage_keys.dart';
import 'package:barbearia_do_artur_mobile/features/auth/infrastructure/models/auth_session_model.dart';
import 'package:barbearia_do_artur_mobile/features/auth/infrastructure/models/auth_user_model.dart';

class AuthLocalDataSource {
  const AuthLocalDataSource({
    required SharedPreferences sharedPreferences,
    required FlutterSecureStorage secureStorage,
  })  : _sharedPreferences = sharedPreferences,
        _secureStorage = secureStorage;

  final SharedPreferences _sharedPreferences;
  final FlutterSecureStorage _secureStorage;

  Future<AuthSessionModel?> readSession() async {
    final accessToken = await _secureStorage.read(
      key: AppStorageKeys.accessToken,
    );
    final refreshToken = await _secureStorage.read(
      key: AppStorageKeys.refreshToken,
    );
    final tokenType = await _secureStorage.read(
      key: AppStorageKeys.tokenType,
    );
    final expiresIn = await _secureStorage.read(
      key: AppStorageKeys.expiresIn,
    );
    final email = _sharedPreferences.getString(AppStorageKeys.userEmail);
    final userId = _sharedPreferences.getString(AppStorageKeys.userId);
    final role = _sharedPreferences.getString(AppStorageKeys.userRole);
    final tenantId = _sharedPreferences.getString(AppStorageKeys.tenantId);

    if (accessToken == null ||
        refreshToken == null ||
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
      refreshToken: refreshToken,
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
    await _secureStorage.write(
      key: AppStorageKeys.accessToken,
      value: session.accessToken,
    );
    await _secureStorage.write(
      key: AppStorageKeys.refreshToken,
      value: session.refreshToken,
    );
    await _secureStorage.write(
      key: AppStorageKeys.tokenType,
      value: session.tokenType,
    );
    await _secureStorage.write(
      key: AppStorageKeys.expiresIn,
      value: session.expiresIn,
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
    await _secureStorage.delete(key: AppStorageKeys.accessToken);
    await _secureStorage.delete(key: AppStorageKeys.refreshToken);
    await _secureStorage.delete(key: AppStorageKeys.tokenType);
    await _secureStorage.delete(key: AppStorageKeys.expiresIn);
    await _sharedPreferences.remove(AppStorageKeys.userId);
    await _sharedPreferences.remove(AppStorageKeys.userEmail);
    await _sharedPreferences.remove(AppStorageKeys.userRole);
    await _sharedPreferences.remove(AppStorageKeys.tenantId);
    await _sharedPreferences.remove(AppStorageKeys.userName);
  }
}
