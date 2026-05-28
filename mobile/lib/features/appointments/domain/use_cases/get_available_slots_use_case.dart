import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/appointment_slot_option.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/repositories/appointments_repository.dart';

class GetAvailableSlotsUseCase {
  const GetAvailableSlotsUseCase(this._repository);

  final AppointmentsRepository _repository;

  Future<Result<List<AppointmentSlotOption>>> call({
    required String accessToken,
    required String serviceId,
    required String professionalId,
    required DateTime date,
  }) {
    return _repository.getAvailableSlots(
      accessToken: accessToken,
      serviceId: serviceId,
      professionalId: professionalId,
      date: date,
    );
  }
}
