import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:salao_da_lu_mobile/core/config/app_environment.dart';
import 'package:salao_da_lu_mobile/core/constants/app_constants.dart';
import 'package:salao_da_lu_mobile/core/network/api_endpoints.dart';
import 'package:salao_da_lu_mobile/core/storage/app_storage_keys.dart';
import 'package:salao_da_lu_mobile/core/storage/shared_preferences_provider.dart';
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
  );
});

class ApiClient {
  ApiClient(this._dio, this._sharedPreferences);

  final Dio _dio;
  final SharedPreferences _sharedPreferences;

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

  Future<Response<T>> _sendWithRefresh<T>({
    required String path,
    required Future<Response<T>> Function(String? accessToken) request,
    String? accessToken,
  }) async {
    final resolvedToken = _resolveAccessToken(path, accessToken);

    try {
      return await request(resolvedToken);
    } on DioException catch (error) {
      if (!_shouldRefresh(path, error)) {
        rethrow;
      }

      final refreshedToken = await _refreshAccessToken();
      if (refreshedToken == null) {
        rethrow;
      }

      return request(refreshedToken);
    }
  }

  String? _resolveAccessToken(String path, String? accessToken) {
    if (_isAnonymousPath(path)) {
      return accessToken;
    }

    return _sharedPreferences.getString(AppStorageKeys.accessToken) ??
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

  bool _shouldRefresh(String path, DioException error) {
    return path != ApiEndpoints.authRefresh &&
        error.response?.statusCode == 401 &&
        (_sharedPreferences.getString(AppStorageKeys.refreshToken)?.isNotEmpty ??
            false);
  }

  Future<String?> _refreshAccessToken() async {
    final refreshToken =
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

      await _sharedPreferences.setString(
        AppStorageKeys.accessToken,
        accessToken,
      );
      await _sharedPreferences.setString(
        AppStorageKeys.refreshToken,
        nextRefreshToken,
      );
      await _sharedPreferences.setString(
        AppStorageKeys.tokenType,
        tokenType,
      );
      await _sharedPreferences.setString(
        AppStorageKeys.expiresIn,
        expiresIn,
      );

      return accessToken;
    } on DioException {
      return null;
    }
  }
}
