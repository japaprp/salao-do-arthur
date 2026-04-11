class LoyaltyActivity {
  const LoyaltyActivity({
    required this.points,
    required this.type,
    required this.createdAt,
    this.reason,
  });

  final int points;
  final String type;
  final DateTime createdAt;
  final String? reason;
}
