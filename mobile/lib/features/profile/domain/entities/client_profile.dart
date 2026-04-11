import 'package:salao_da_lu_mobile/features/profile/domain/entities/client_profile_appointment.dart';
import 'package:salao_da_lu_mobile/features/profile/domain/entities/loyalty_activity.dart';

class ClientProfile {
  const ClientProfile({
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
  final List<ClientProfileAppointment> recentAppointments;
  final List<LoyaltyActivity> loyaltyActivities;
}
