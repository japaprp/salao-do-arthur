import 'package:barbearia_do_artur_mobile/features/profile/domain/entities/client_profile.dart';
import 'package:barbearia_do_artur_mobile/features/profile/infrastructure/models/client_profile_appointment_model.dart';
import 'package:barbearia_do_artur_mobile/features/profile/infrastructure/models/loyalty_activity_model.dart';

class ClientProfileModel {
  const ClientProfileModel({
    required this.id,
    required this.name,
    required this.email,
    required this.memberSince,
    required this.loyaltyPoints,
    required this.lifetimeValue,
    required this.pointsBalance,
    required this.recentAppointments,
    required this.loyaltyActivities,
    this.favoriteProfessionalName,
  });

  final String id;
  final String name;
  final String email;
  final DateTime memberSince;
  final int loyaltyPoints;
  final double lifetimeValue;
  final int pointsBalance;
  final String? favoriteProfessionalName;
  final List<ClientProfileAppointmentModel> recentAppointments;
  final List<LoyaltyActivityModel> loyaltyActivities;

  factory ClientProfileModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? const {};
    final favoriteProfessional =
        json['favoriteProfessional'] as Map<String, dynamic>? ?? const {};
    final favoriteProfessionalUser =
        favoriteProfessional['user'] as Map<String, dynamic>? ?? const {};
    final loyaltyWallet =
        json['loyaltyWallet'] as Map<String, dynamic>? ?? const {};
    final appointments = json['appointments'] as List<dynamic>? ?? const [];
    final loyaltyTransactions =
        loyaltyWallet['loyaltyTransactions'] as List<dynamic>? ?? const [];

    return ClientProfileModel(
      id: json['id'] as String? ?? '',
      name: user['name'] as String? ?? 'Cliente',
      email: user['email'] as String? ?? 'cliente@barbeariadoartur.app',
      memberSince: _parseDateTime(json['createdAt']),
      loyaltyPoints: (json['loyaltyPoints'] as num?)?.toInt() ?? 0,
      lifetimeValue: double.tryParse('${json['lifetimeValue'] ?? 0}') ?? 0,
      pointsBalance: (loyaltyWallet['pointsBalance'] as num?)?.toInt() ?? 0,
      favoriteProfessionalName: favoriteProfessionalUser['name'] as String?,
      recentAppointments: appointments
          .whereType<Map>()
          .map(
            (item) => ClientProfileAppointmentModel.fromJson(
              Map<String, dynamic>.from(item),
            ),
          )
          .toList(growable: false),
      loyaltyActivities: loyaltyTransactions
          .whereType<Map>()
          .map(
            (item) => LoyaltyActivityModel.fromJson(
              Map<String, dynamic>.from(item),
            ),
          )
          .toList(growable: false),
    );
  }

  ClientProfile toEntity() {
    return ClientProfile(
      id: id,
      name: name,
      email: email,
      memberSince: memberSince,
      loyaltyPoints: loyaltyPoints,
      lifetimeValue: lifetimeValue,
      pointsBalance: pointsBalance,
      favoriteProfessionalName: favoriteProfessionalName,
      recentAppointments: recentAppointments
          .map((item) => item.toEntity())
          .toList(growable: false),
      loyaltyActivities: loyaltyActivities
          .map((item) => item.toEntity())
          .toList(growable: false),
    );
  }

  static DateTime _parseDateTime(Object? value) {
    final parsed = DateTime.tryParse('${value ?? ''}') ?? DateTime.now();
    return parsed.isUtc ? parsed.toLocal() : parsed;
  }
}
