import 'package:salao_da_lu_mobile/features/appointments/domain/entities/appointment_service_option.dart';

class AppointmentServiceOptionModel {
  const AppointmentServiceOptionModel({
    required this.id,
    required this.name,
    required this.durationMinutes,
    required this.price,
    this.description,
  });

  final String id;
  final String name;
  final int durationMinutes;
  final double price;
  final String? description;

  factory AppointmentServiceOptionModel.fromJson(Map<String, dynamic> json) {
    return AppointmentServiceOptionModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      durationMinutes: (json['durationMinutes'] as num?)?.toInt() ?? 0,
      price: double.tryParse('${json['price'] ?? 0}') ?? 0,
      description: json['description'] as String?,
    );
  }

  AppointmentServiceOption toEntity() {
    return AppointmentServiceOption(
      id: id,
      name: name,
      durationMinutes: durationMinutes,
      price: price,
      description: description,
    );
  }
}
