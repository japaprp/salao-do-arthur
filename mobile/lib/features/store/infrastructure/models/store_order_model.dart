class StoreOrderItemModel {
  const StoreOrderItemModel({
    required this.productName,
    required this.quantity,
    required this.totalAmount,
  });

  final String productName;
  final int quantity;
  final double totalAmount;

  factory StoreOrderItemModel.fromJson(Map<String, dynamic> json) {
    return StoreOrderItemModel(
      productName: json['productName']?.toString() ?? 'Produto',
      quantity: int.tryParse('${json['quantity'] ?? 0}') ?? 0,
      totalAmount: _readDouble(json['totalAmount']),
    );
  }
}

class StoreOrderModel {
  const StoreOrderModel({
    required this.id,
    required this.number,
    required this.status,
    required this.paymentStatus,
    required this.totalAmount,
    required this.items,
  });

  final String id;
  final String number;
  final String status;
  final String paymentStatus;
  final double totalAmount;
  final List<StoreOrderItemModel> items;

  String get displayStatus {
    return switch (status) {
      'PAID' => 'Pagamento aprovado',
      'PENDING_PAYMENT' => 'Aguardando pagamento',
      'CANCELLED' => 'Cancelado',
      'REFUNDED' => 'Estornado',
      _ => status,
    };
  }

  factory StoreOrderModel.fromJson(Map<String, dynamic> json) {
    final items = json['items'] as List<dynamic>? ?? const [];
    final payments = json['payments'] as List<dynamic>? ?? const [];
    final payment = payments.whereType<Map>().isNotEmpty
        ? Map<String, dynamic>.from(payments.whereType<Map>().first)
        : const <String, dynamic>{};
    return StoreOrderModel(
      id: json['id']?.toString() ?? '',
      number: json['number']?.toString() ?? 'Pedido',
      status: json['status']?.toString() ?? 'PENDING_PAYMENT',
      paymentStatus: payment['status']?.toString() ?? 'PENDING',
      totalAmount: _readDouble(json['totalAmount']),
      items: items
          .whereType<Map>()
          .map((item) => StoreOrderItemModel.fromJson(Map<String, dynamic>.from(item)))
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
