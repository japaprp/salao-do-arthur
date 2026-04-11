import 'package:salao_da_lu_mobile/features/profile/domain/entities/client_profile_appointment.dart';

class ClientProfileAppointmentModel {
  const ClientProfileAppointmentModel({
    required this.id,
    required this.serviceName,
    required this.professionalName,
    required this.scheduledAt,
    required this.status,
    required this.totalAmount,
  });

  final String id;
  final String serviceName;
  final String professionalName;
  final DateTime scheduledAt;
  final String status;
  final double totalAmount;

  factory ClientProfileAppointmentModel.fromJson(Map<String, dynamic> json) {
    final service = json['service'] as Map<String, dynamic>? ?? const {};
    final professional =
        json['professional'] as Map<String, dynamic>? ?? const {};
    final professionalUser =
        professional['user'] as Map<String, dynamic>? ?? const {};

    return ClientProfileAppointmentModel(
      id: json['id'] as String? ?? '',
      serviceName: service['name'] as String? ?? 'Servico',
      professionalName: professionalUser['name'] as String? ?? 'Profissional',
      scheduledAt: _parseDateTime(json['scheduledAt']),
      status: json['status'] as String? ?? '',
      totalAmount: double.tryParse('${json['totalAmount'] ?? 0}') ?? 0,
    );
  }

  ClientProfileAppointment toEntity() {
    return ClientProfileAppointment(
      id: id,
      serviceName: serviceName,
      professionalName: professionalName,
      scheduledAt: scheduledAt,
      status: status,
      totalAmount: totalAmount,
    );
  }

  static DateTime _parseDateTime(Object? value) {
    final parsed = DateTime.tryParse('${value ?? ''}') ?? DateTime.now();
    return parsed.isUtc ? parsed.toLocal() : parsed;
  }
}
