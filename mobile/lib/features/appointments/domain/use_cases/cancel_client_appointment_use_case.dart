import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/client_appointment.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/repositories/appointments_repository.dart';

class CancelClientAppointmentUseCase {
  const CancelClientAppointmentUseCase(this._repository);

  final AppointmentsRepository _repository;

  Future<Result<ClientAppointment>> call({
    required String accessToken,
    required String appointmentId,
  }) {
    return _repository.cancelAppointment(
      accessToken: accessToken,
      appointmentId: appointmentId,
    );
  }
}
