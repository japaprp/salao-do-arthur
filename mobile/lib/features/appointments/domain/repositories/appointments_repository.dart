import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/appointment_professional_option.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/appointment_service_option.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/appointment_slot_option.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/client_appointment.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/create_client_appointment_command.dart';

abstract interface class AppointmentsRepository {
  Future<Result<List<AppointmentServiceOption>>> getServiceOptions(
    String accessToken,
  );

  Future<Result<List<AppointmentProfessionalOption>>>
      getAvailableProfessionals({
    required String accessToken,
    required String serviceId,
  });

  Future<Result<List<AppointmentSlotOption>>> getAvailableSlots({
    required String accessToken,
    required String serviceId,
    required String professionalId,
    required DateTime date,
  });

  Future<Result<List<ClientAppointment>>> getMyAppointments(String accessToken);

  Future<Result<ClientAppointment>> bookAppointment({
    required String accessToken,
    required CreateClientAppointmentCommand command,
  });
}
