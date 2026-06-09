import 'package:barbearia_do_artur_mobile/features/store/infrastructure/models/store_cart_model.dart';
import 'package:barbearia_do_artur_mobile/features/store/infrastructure/models/store_order_model.dart';
import 'package:barbearia_do_artur_mobile/features/store/infrastructure/models/store_product_model.dart';

class StoreState {
  const StoreState({
    this.isLoading = false,
    this.isSubmitting = false,
    this.products = const [],
    this.cart,
    this.orders = const [],
    this.favoriteProductIds = const {},
    this.failureMessage,
    this.successMessage,
  });

  final bool isLoading;
  final bool isSubmitting;
  final List<StoreProductModel> products;
  final StoreCartModel? cart;
  final List<StoreOrderModel> orders;
  final Set<String> favoriteProductIds;
  final String? failureMessage;
  final String? successMessage;

  StoreCartModel get resolvedCart => cart ?? StoreCartModel.empty();

  StoreState copyWith({
    bool? isLoading,
    bool? isSubmitting,
    List<StoreProductModel>? products,
    StoreCartModel? cart,
    List<StoreOrderModel>? orders,
    Set<String>? favoriteProductIds,
    String? failureMessage,
    String? successMessage,
    bool clearFailureMessage = false,
    bool clearSuccessMessage = false,
  }) {
    return StoreState(
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      products: products ?? this.products,
      cart: cart ?? this.cart,
      orders: orders ?? this.orders,
      favoriteProductIds: favoriteProductIds ?? this.favoriteProductIds,
      failureMessage:
          clearFailureMessage ? null : failureMessage ?? this.failureMessage,
      successMessage:
          clearSuccessMessage ? null : successMessage ?? this.successMessage,
    );
  }
}
