import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/client_appointment.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/repositories/appointments_repository.dart';

class GetMyAppointmentsUseCase {
  const GetMyAppointmentsUseCase(this._repository);

  final AppointmentsRepository _repository;

  Future<Result<List<ClientAppointment>>> call(String accessToken) {
    return _repository.getMyAppointments(accessToken);
  }
}
