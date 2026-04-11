import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:salao_da_lu_mobile/core/config/app_environment.dart';
import 'package:salao_da_lu_mobile/core/constants/app_constants.dart';

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

  return ApiClient(dio);
});

class ApiClient {
  ApiClient(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> get(
    String path, {
    String? accessToken,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      path,
      options: Options(
        headers: _authorizationHeaders(accessToken),
      ),
    );

    return response.data ?? <String, dynamic>{};
  }

  Future<List<Map<String, dynamic>>> getList(
    String path, {
    String? accessToken,
  }) async {
    final response = await _dio.get<List<dynamic>>(
      path,
      options: Options(
        headers: _authorizationHeaders(accessToken),
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
    final response = await _dio.post<Map<String, dynamic>>(
      path,
      data: data,
      options: Options(
        headers: _authorizationHeaders(accessToken),
      ),
    );

    return response.data ?? <String, dynamic>{};
  }

  Map<String, String>? _authorizationHeaders(String? accessToken) {
    if (accessToken == null || accessToken.isEmpty) {
      return null;
    }

    return {
      'Authorization': 'Bearer $accessToken',
    };
  }
}
