import 'package:salao_da_lu_mobile/core/result/result.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/entities/client_appointment.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/entities/create_client_appointment_command.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/repositories/appointments_repository.dart';

class BookClientAppointmentUseCase {
  const BookClientAppointmentUseCase(this._repository);

  final AppointmentsRepository _repository;

  Future<Result<ClientAppointment>> call({
    required String accessToken,
    required CreateClientAppointmentCommand command,
  }) {
    return _repository.bookAppointment(
      accessToken: accessToken,
      command: command,
    );
  }
}
