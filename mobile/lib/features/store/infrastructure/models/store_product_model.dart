class StoreProductModel {
  const StoreProductModel({
    required this.id,
    required this.name,
    required this.price,
    required this.availableQty,
    required this.trackInventory,
    this.description,
    this.imageUrl,
  });

  final String id;
  final String name;
  final String? description;
  final double price;
  final int availableQty;
  final bool trackInventory;
  final String? imageUrl;

  bool get inStock => !trackInventory || availableQty > 0;

  factory StoreProductModel.fromJson(Map<String, dynamic> json) {
    final images = json['images'] as List<dynamic>? ?? const [];
    final cover = images.whereType<Map>().cast<Map<dynamic, dynamic>>().firstWhere(
          (item) => item['isCover'] == true,
          orElse: () => images.whereType<Map>().cast<Map<dynamic, dynamic>>().isNotEmpty
              ? images.whereType<Map>().cast<Map<dynamic, dynamic>>().first
              : const {},
        );
    final inventory = json['inventory'] is Map<String, dynamic>
        ? json['inventory'] as Map<String, dynamic>
        : const <String, dynamic>{};

    return StoreProductModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Produto',
      description:
          json['shortDescription']?.toString() ?? json['description']?.toString(),
      price: _readDouble(json['price']),
      availableQty: int.tryParse('${inventory['availableQty'] ?? 0}') ?? 0,
      trackInventory: json['trackInventory'] != false,
      imageUrl: cover['url']?.toString(),
    );
  }

  static double _readDouble(Object? value) {
    if (value is num) {
      return value.toDouble();
    }
    return double.tryParse('$value') ?? 0;
  }
}
