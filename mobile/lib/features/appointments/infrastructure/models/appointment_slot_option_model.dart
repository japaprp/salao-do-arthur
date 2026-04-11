import 'package:salao_da_lu_mobile/features/appointments/domain/entities/appointment_slot_option.dart';

class AppointmentSlotOptionModel {
  const AppointmentSlotOptionModel({
    required this.startAt,
    required this.endAt,
    required this.label,
  });

  final DateTime startAt;
  final DateTime endAt;
  final String label;

  factory AppointmentSlotOptionModel.fromJson(Map<String, dynamic> json) {
    return AppointmentSlotOptionModel(
      startAt: _parseDateTime(json['startAt']),
      endAt: _parseDateTime(json['endAt']),
      label: json['label'] as String? ?? '',
    );
  }

  AppointmentSlotOption toEntity() {
    return AppointmentSlotOption(
      startAt: startAt,
      endAt: endAt,
      label: label,
    );
  }

  static DateTime _parseDateTime(Object? value) {
    final parsed = DateTime.tryParse('${value ?? ''}') ?? DateTime.now();
    return parsed.isUtc ? parsed.toLocal() : parsed;
  }
}
