import 'package:barbearia_do_artur_mobile/core/network/api_client.dart';
import 'package:barbearia_do_artur_mobile/core/network/api_endpoints.dart';
import 'package:barbearia_do_artur_mobile/features/profile/infrastructure/models/client_profile_model.dart';

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

  Future<ClientProfileModel> redeemPoints({
    required String accessToken,
    required int points,
    required String reason,
  }) async {
    await _apiClient.post(
      ApiEndpoints.loyaltyRedeem,
      accessToken: accessToken,
      data: {
        'points': points,
        'reason': reason,
      },
    );

    return getClientProfile(accessToken);
  }
}
