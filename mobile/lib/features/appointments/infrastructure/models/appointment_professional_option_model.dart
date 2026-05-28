import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/appointment_professional_option.dart';

class AppointmentProfessionalOptionModel {
  const AppointmentProfessionalOptionModel({
    required this.id,
    required this.name,
    this.specialty,
  });

  final String id;
  final String name;
  final String? specialty;

  factory AppointmentProfessionalOptionModel.fromJson(
      Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? const {};

    return AppointmentProfessionalOptionModel(
      id: json['id'] as String? ?? '',
      name: user['name'] as String? ?? 'Profissional',
      specialty: json['specialty'] as String?,
    );
  }

  AppointmentProfessionalOption toEntity() {
    return AppointmentProfessionalOption(
      id: id,
      name: name,
      specialty: specialty,
    );
  }
}
