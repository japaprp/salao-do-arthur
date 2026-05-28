import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/appointment_service_option.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/repositories/appointments_repository.dart';

class GetServiceOptionsUseCase {
  const GetServiceOptionsUseCase(this._repository);

  final AppointmentsRepository _repository;

  Future<Result<List<AppointmentServiceOption>>> call(String accessToken) {
    return _repository.getServiceOptions(accessToken);
  }
}
