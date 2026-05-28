import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/appointment_professional_option.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/repositories/appointments_repository.dart';

class GetAvailableProfessionalsUseCase {
  const GetAvailableProfessionalsUseCase(this._repository);

  final AppointmentsRepository _repository;

  Future<Result<List<AppointmentProfessionalOption>>> call({
    required String accessToken,
    required String serviceId,
  }) {
    return _repository.getAvailableProfessionals(
      accessToken: accessToken,
      serviceId: serviceId,
    );
  }
}
