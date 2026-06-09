import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barbearia_do_artur_mobile/core/config/app_environment.dart';
import 'package:barbearia_do_artur_mobile/core/constants/app_constants.dart';
import 'package:barbearia_do_artur_mobile/core/network/api_endpoints.dart';
import 'package:barbearia_do_artur_mobile/core/storage/app_storage_keys.dart';
import 'package:barbearia_do_artur_mobile/core/storage/secure_storage_provider.dart';
import 'package:barbearia_do_artur_mobile/core/storage/shared_preferences_provider.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppEnvironment.apiBaseUrl,
      connectTimeout: AppConstants.requestTimeout,
      receiveTimeout: AppConstants.requestTimeout,
      headers: const {
        'Content-Type': 'application/json',
      },
    ),
  );

  return ApiClient(
    dio,
    ref.watch(sharedPreferencesProvider),
    ref.watch(secureStorageProvider),
  );
});

class ApiClient {
  ApiClient(this._dio, this._sharedPreferences, this._secureStorage);

  final Dio _dio;
  final SharedPreferences _sharedPreferences;
  final FlutterSecureStorage _secureStorage;

  Future<Map<String, dynamic>> get(
    String path, {
    String? accessToken,
  }) async {
    final response = await _sendWithRefresh<Map<String, dynamic>>(
      path: path,
      accessToken: accessToken,
      request: (resolvedToken) => _dio.get<Map<String, dynamic>>(
        path,
        options: Options(
          headers: _authorizationHeaders(path, resolvedToken),
        ),
      ),
    );

    return response.data ?? <String, dynamic>{};
  }

  Future<List<Map<String, dynamic>>> getList(
    String path, {
    String? accessToken,
  }) async {
    final response = await _sendWithRefresh<List<dynamic>>(
      path: path,
      accessToken: accessToken,
      request: (resolvedToken) => _dio.get<List<dynamic>>(
        path,
        options: Options(
          headers: _authorizationHeaders(path, resolvedToken),
        ),
      ),
    );

    return (response.data ?? const <dynamic>[])
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? data,
    String? accessToken,
  }) async {
    final response = await _sendWithRefresh<Map<String, dynamic>>(
      path: path,
      accessToken: accessToken,
      request: (resolvedToken) => _dio.post<Map<String, dynamic>>(
        path,
        data: data,
        options: Options(
          headers: _authorizationHeaders(path, resolvedToken),
        ),
      ),
    );

    return response.data ?? <String, dynamic>{};
  }

  Future<Map<String, dynamic>> put(
    String path, {
    Map<String, dynamic>? data,
    String? accessToken,
  }) async {
    final response = await _sendWithRefresh<Map<String, dynamic>>(
      path: path,
      accessToken: accessToken,
      request: (resolvedToken) => _dio.put<Map<String, dynamic>>(
        path,
        data: data,
        options: Options(
          headers: _authorizationHeaders(path, resolvedToken),
        ),
      ),
    );

    return response.data ?? <String, dynamic>{};
  }

  Future<Map<String, dynamic>> delete(
    String path, {
    String? accessToken,
  }) async {
    final response = await _sendWithRefresh<Map<String, dynamic>>(
      path: path,
      accessToken: accessToken,
      request: (resolvedToken) => _dio.delete<Map<String, dynamic>>(
        path,
        options: Options(
          headers: _authorizationHeaders(path, resolvedToken),
        ),
      ),
    );

    return response.data ?? <String, dynamic>{};
  }

  Future<Response<T>> _sendWithRefresh<T>({
    required String path,
    required Future<Response<T>> Function(String? accessToken) request,
    String? accessToken,
  }) async {
    final resolvedToken = await _resolveAccessToken(path, accessToken);

    try {
      return await request(resolvedToken);
    } on DioException catch (error) {
      if (!await _shouldRefresh(path, error)) {
        rethrow;
      }

      final refreshedToken = await _refreshAccessToken();
      if (refreshedToken == null) {
        rethrow;
      }

      return request(refreshedToken);
    }
  }

  Future<String?> _resolveAccessToken(String path, String? accessToken) async {
    if (_isAnonymousPath(path)) {
      return accessToken;
    }

    return await _secureStorage.read(key: AppStorageKeys.accessToken) ??
        _sharedPreferences.getString(AppStorageKeys.accessToken) ??
        accessToken;
  }

  Map<String, String>? _authorizationHeaders(
    String path,
    String? accessToken,
  ) {
    if (_isAnonymousPath(path)) {
      return null;
    }

    if (accessToken == null || accessToken.isEmpty) {
      return null;
    }

    return {
      'Authorization': 'Bearer $accessToken',
    };
  }

  bool _isAnonymousPath(String path) {
    return path == ApiEndpoints.authLogin ||
        path == ApiEndpoints.authRegister ||
        path == ApiEndpoints.authRefresh;
  }

  Future<bool> _shouldRefresh(String path, DioException error) async {
    final refreshToken = await _secureStorage.read(
          key: AppStorageKeys.refreshToken,
        ) ??
        _sharedPreferences.getString(AppStorageKeys.refreshToken);

    return path != ApiEndpoints.authRefresh &&
        error.response?.statusCode == 401 &&
        (refreshToken?.isNotEmpty ?? false);
  }

  Future<String?> _refreshAccessToken() async {
    final refreshToken = await _secureStorage.read(
          key: AppStorageKeys.refreshToken,
        ) ??
        _sharedPreferences.getString(AppStorageKeys.refreshToken);
    if (refreshToken == null || refreshToken.isEmpty) {
      return null;
    }

    try {
      final response = await _dio.post<Map<String, dynamic>>(
        ApiEndpoints.authRefresh,
        data: {
          'refreshToken': refreshToken,
        },
      );

      final payload = response.data ?? <String, dynamic>{};
      final accessToken = payload['accessToken']?.toString() ?? '';
      final nextRefreshToken = payload['refreshToken']?.toString() ?? '';
      final tokenType = payload['tokenType']?.toString() ?? 'Bearer';
      final expiresIn = '${payload['expiresIn'] ?? ''}';

      if (accessToken.isEmpty || nextRefreshToken.isEmpty) {
        return null;
      }

      await _secureStorage.write(
        key: AppStorageKeys.accessToken,
        value: accessToken,
      );
      await _secureStorage.write(
        key: AppStorageKeys.refreshToken,
        value: nextRefreshToken,
      );
      await _secureStorage.write(
        key: AppStorageKeys.tokenType,
        value: tokenType,
      );
      await _secureStorage.write(
        key: AppStorageKeys.expiresIn,
        value: expiresIn,
      );

      return accessToken;
    } on DioException {
      return null;
    }
  }
}
