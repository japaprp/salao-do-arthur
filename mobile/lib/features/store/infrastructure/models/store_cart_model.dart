import 'package:barbearia_do_artur_mobile/features/store/infrastructure/models/store_product_model.dart';

class StoreCartItemModel {
  const StoreCartItemModel({
    required this.id,
    required this.product,
    required this.quantity,
    required this.totalAmount,
  });

  final String id;
  final StoreProductModel product;
  final int quantity;
  final double totalAmount;

  factory StoreCartItemModel.fromJson(Map<String, dynamic> json) {
    return StoreCartItemModel(
      id: json['id']?.toString() ?? '',
      product: StoreProductModel.fromJson(
        json['product'] is Map<String, dynamic>
            ? json['product'] as Map<String, dynamic>
            : const <String, dynamic>{},
      ),
      quantity: int.tryParse('${json['quantity'] ?? 0}') ?? 0,
      totalAmount: _readDouble(json['totalAmount']),
    );
  }
}

class StoreCartModel {
  const StoreCartModel({
    required this.id,
    required this.items,
  });

  final String id;
  final List<StoreCartItemModel> items;

  double get totalAmount =>
      items.fold(0, (sum, item) => sum + item.totalAmount);

  int get totalItems => items.fold(0, (sum, item) => sum + item.quantity);

  factory StoreCartModel.empty() {
    return const StoreCartModel(id: '', items: []);
  }

  factory StoreCartModel.fromJson(Map<String, dynamic> json) {
    final items = json['items'] as List<dynamic>? ?? const [];
    return StoreCartModel(
      id: json['id']?.toString() ?? '',
      items: items
          .whereType<Map>()
          .map((item) => StoreCartItemModel.fromJson(Map<String, dynamic>.from(item)))
          .toList(growable: false),
    );
  }
}

double _readDouble(Object? value) {
  if (value is num) {
    return value.toDouble();
  }
  return double.tryParse('$value') ?? 0;
}
