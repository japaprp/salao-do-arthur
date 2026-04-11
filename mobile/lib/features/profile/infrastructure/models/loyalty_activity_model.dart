import 'package:salao_da_lu_mobile/features/profile/domain/entities/loyalty_activity.dart';

class LoyaltyActivityModel {
  const LoyaltyActivityModel({
    required this.points,
    required this.type,
    required this.createdAt,
    this.reason,
  });

  final int points;
  final String type;
  final DateTime createdAt;
  final String? reason;

  factory LoyaltyActivityModel.fromJson(Map<String, dynamic> json) {
    return LoyaltyActivityModel(
      points: (json['points'] as num?)?.toInt() ?? 0,
      type: json['type'] as String? ?? '',
      createdAt: _parseDateTime(json['createdAt']),
      reason: json['reason'] as String?,
    );
  }

  LoyaltyActivity toEntity() {
    return LoyaltyActivity(
      points: points,
      type: type,
      createdAt: createdAt,
      reason: reason,
    );
  }

  static DateTime _parseDateTime(Object? value) {
    final parsed = DateTime.tryParse('${value ?? ''}') ?? DateTime.now();
    return parsed.isUtc ? parsed.toLocal() : parsed;
  }
}
