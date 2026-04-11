import 'package:salao_da_lu_mobile/core/network/api_client.dart';
import 'package:salao_da_lu_mobile/core/network/api_endpoints.dart';
import 'package:salao_da_lu_mobile/features/profile/infrastructure/models/client_profile_model.dart';

class ProfileRemoteDataSource {
  const ProfileRemoteDataSource(this._apiClient);

  final ApiClient _apiClient;

  Future<ClientProfileModel> getClientProfile(String accessToken) async {
    final response = await _apiClient.get(
      ApiEndpoints.clientsMe,
      accessToken: accessToken,
    );

    return ClientProfileModel.fromJson(response);
  }
}
