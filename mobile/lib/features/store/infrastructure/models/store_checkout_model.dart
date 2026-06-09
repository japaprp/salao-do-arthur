import 'package:barbearia_do_artur_mobile/features/store/infrastructure/models/store_order_model.dart';

class StoreCheckoutModel {
  const StoreCheckoutModel({
    required this.order,
    required this.checkoutUrl,
    required this.expiresAt,
  });

  final StoreOrderModel order;
  final String checkoutUrl;
  final DateTime? expiresAt;

  factory StoreCheckoutModel.fromJson(Map<String, dynamic> json) {
    final checkout = json['checkout'] is Map<String, dynamic>
        ? json['checkout'] as Map<String, dynamic>
        : const <String, dynamic>{};
    return StoreCheckoutModel(
      order: StoreOrderModel.fromJson(
        json['order'] is Map<String, dynamic>
            ? json['order'] as Map<String, dynamic>
            : json,
      ),
      checkoutUrl: checkout['checkoutUrl']?.toString() ?? '',
      expiresAt: DateTime.tryParse(checkout['expiresAt']?.toString() ?? ''),
    );
  }
}
