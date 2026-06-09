import 'package:barbearia_do_artur_mobile/core/network/api_client.dart';
import 'package:barbearia_do_artur_mobile/core/network/api_endpoints.dart';
import 'package:barbearia_do_artur_mobile/features/store/infrastructure/models/store_cart_model.dart';
import 'package:barbearia_do_artur_mobile/features/store/infrastructure/models/store_checkout_model.dart';
import 'package:barbearia_do_artur_mobile/features/store/infrastructure/models/store_order_model.dart';
import 'package:barbearia_do_artur_mobile/features/store/infrastructure/models/store_product_model.dart';

class StoreRemoteDataSource {
  const StoreRemoteDataSource(this._apiClient);

  final ApiClient _apiClient;

  Future<List<StoreProductModel>> getProducts(String accessToken) async {
    final response = await _apiClient.getList(
      ApiEndpoints.storeProducts,
      accessToken: accessToken,
    );

    return response.map(StoreProductModel.fromJson).toList(growable: false);
  }

  Future<StoreCartModel> getCart(String accessToken) async {
    final response = await _apiClient.get(
      ApiEndpoints.storeCart,
      accessToken: accessToken,
    );

    return StoreCartModel.fromJson(response);
  }

  Future<StoreCartModel> addCartItem({
    required String accessToken,
    required String productId,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.storeCartItems,
      accessToken: accessToken,
      data: {
        'productId': productId,
        'quantity': 1,
      },
    );

    return StoreCartModel.fromJson(response);
  }

  Future<StoreCartModel> updateCartItem({
    required String accessToken,
    required String itemId,
    required int quantity,
  }) async {
    final response = await _apiClient.put(
      ApiEndpoints.storeCartItem(itemId),
      accessToken: accessToken,
      data: {
        'quantity': quantity,
      },
    );

    return StoreCartModel.fromJson(response);
  }

  Future<StoreCartModel> removeCartItem({
    required String accessToken,
    required String itemId,
  }) async {
    final response = await _apiClient.delete(
      ApiEndpoints.storeCartItem(itemId),
      accessToken: accessToken,
    );

    return StoreCartModel.fromJson(response);
  }

  Future<StoreCheckoutModel> checkout(String accessToken) async {
    final response = await _apiClient.post(
      ApiEndpoints.storeCheckout,
      accessToken: accessToken,
      data: {
        'deliveryMethod': 'PICKUP',
        'paymentMethod': 'PIX',
      },
    );

    return StoreCheckoutModel.fromJson(response);
  }

  Future<List<StoreOrderModel>> getOrders(String accessToken) async {
    final response = await _apiClient.getList(
      ApiEndpoints.storeOrders,
      accessToken: accessToken,
    );

    return response.map(StoreOrderModel.fromJson).toList(growable: false);
  }

  Future<StoreOrderModel> getOrderStatus({
    required String accessToken,
    required String orderId,
  }) async {
    final response = await _apiClient.get(
      ApiEndpoints.paymentOrderStatus(orderId),
      accessToken: accessToken,
    );

    return StoreOrderModel.fromJson(response);
  }

  Future<List<String>> getFavoriteProductIds(String accessToken) async {
    final response = await _apiClient.getList(
      ApiEndpoints.storeFavorites,
      accessToken: accessToken,
    );

    return response
        .map((item) => item['productId']?.toString() ?? '')
        .where((id) => id.isNotEmpty)
        .toList(growable: false);
  }

  Future<void> addFavorite({
    required String accessToken,
    required String productId,
  }) async {
    await _apiClient.post(
      ApiEndpoints.storeFavoriteProduct(productId),
      accessToken: accessToken,
    );
  }

  Future<void> removeFavorite({
    required String accessToken,
    required String productId,
  }) async {
    await _apiClient.delete(
      ApiEndpoints.storeFavoriteProduct(productId),
      accessToken: accessToken,
    );
  }
}
