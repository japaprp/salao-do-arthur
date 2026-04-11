import 'package:salao_da_lu_mobile/features/appointments/domain/entities/client_appointment.dart';

class ClientAppointmentModel {
  const ClientAppointmentModel({
    required this.id,
    required this.serviceName,
    required this.professionalName,
    required this.scheduledAt,
    required this.status,
    required this.durationMinutes,
    required this.totalAmount,
    this.notes,
  });

  final String id;
  final String serviceName;
  final String professionalName;
  final DateTime scheduledAt;
  final String status;
  final int durationMinutes;
  final double totalAmount;
  final String? notes;

  factory ClientAppointmentModel.fromJson(Map<String, dynamic> json) {
    final service = json['service'] as Map<String, dynamic>? ?? const {};
    final professional =
        json['professional'] as Map<String, dynamic>? ?? const {};
    final professionalUser =
        professional['user'] as Map<String, dynamic>? ?? const {};

    return ClientAppointmentModel(
      id: json['id'] as String? ?? '',
      serviceName: service['name'] as String? ?? 'Servico',
      professionalName: professionalUser['name'] as String? ?? 'Profissional',
      scheduledAt: _parseDateTime(json['scheduledAt']),
      status: json['status'] as String? ?? '',
      durationMinutes: (json['durationMinutes'] as num?)?.toInt() ?? 0,
      totalAmount: double.tryParse('${json['totalAmount'] ?? 0}') ?? 0,
      notes: json['notes'] as String?,
    );
  }

  ClientAppointment toEntity() {
    return ClientAppointment(
      id: id,
      serviceName: serviceName,
      professionalName: professionalName,
      scheduledAt: scheduledAt,
      status: status,
      durationMinutes: durationMinutes,
      totalAmount: totalAmount,
      notes: notes,
    );
  }

  static DateTime _parseDateTime(Object? value) {
    final parsed = DateTime.tryParse('${value ?? ''}') ?? DateTime.now();
    return parsed.isUtc ? parsed.toLocal() : parsed;
  }
}
