import 'package:barbearia_do_artur_mobile/core/network/api_client.dart';
import 'package:barbearia_do_artur_mobile/core/network/api_endpoints.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/create_client_appointment_command.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/infrastructure/models/appointment_professional_option_model.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/infrastructure/models/appointment_service_option_model.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/infrastructure/models/appointment_slot_option_model.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/infrastructure/models/client_appointment_model.dart';

class AppointmentsRemoteDataSource {
  const AppointmentsRemoteDataSource(this._apiClient);

  final ApiClient _apiClient;

  Future<List<AppointmentServiceOptionModel>> getServiceOptions(
    String accessToken,
  ) async {
    final response = await _apiClient.getList(
      ApiEndpoints.servicesActive,
      accessToken: accessToken,
    );

    return response
        .map(AppointmentServiceOptionModel.fromJson)
        .toList(growable: false);
  }

  Future<List<AppointmentProfessionalOptionModel>> getAvailableProfessionals({
    required String accessToken,
    required String serviceId,
  }) async {
    final response = await _apiClient.getList(
      ApiEndpoints.professionalsAvailable(serviceId),
      accessToken: accessToken,
    );

    return response
        .map(AppointmentProfessionalOptionModel.fromJson)
        .toList(growable: false);
  }

  Future<List<AppointmentSlotOptionModel>> getAvailableSlots({
    required String accessToken,
    required String serviceId,
    required String professionalId,
    required DateTime date,
  }) async {
    final response = await _apiClient.getList(
      ApiEndpoints.appointmentsAvailableSlots(
        serviceId: serviceId,
        professionalId: professionalId,
        date: date,
      ),
      accessToken: accessToken,
    );

    return response
        .map(AppointmentSlotOptionModel.fromJson)
        .toList(growable: false);
  }

  Future<List<ClientAppointmentModel>> getMyAppointments(
      String accessToken) async {
    final response = await _apiClient.getList(
      ApiEndpoints.appointmentsMine,
      accessToken: accessToken,
    );

    return response
        .map(ClientAppointmentModel.fromJson)
        .toList(growable: false);
  }

  Future<ClientAppointmentModel> bookAppointment({
    required String accessToken,
    required CreateClientAppointmentCommand command,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.appointmentsBook,
      accessToken: accessToken,
      data: {
        'serviceId': command.serviceId,
        'professionalId': command.professionalId,
        'scheduledAt': command.scheduledAt.toUtc().toIso8601String(),
        'notes': command.notes,
      },
    );

    return ClientAppointmentModel.fromJson(response);
  }

  Future<ClientAppointmentModel> cancelAppointment({
    required String accessToken,
    required String appointmentId,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.appointmentsMineCancel(appointmentId),
      accessToken: accessToken,
    );
    final appointmentJson =
        response['appointment'] is Map<String, dynamic>
            ? response['appointment'] as Map<String, dynamic>
            : response;

    return ClientAppointmentModel.fromJson(appointmentJson);
  }

  Future<ClientAppointmentModel> rescheduleAppointment({
    required String accessToken,
    required String appointmentId,
    required DateTime scheduledAt,
  }) async {
    final response = await _apiClient.put(
      ApiEndpoints.appointmentsMineReschedule(appointmentId),
      accessToken: accessToken,
      data: {
        'scheduledAt': scheduledAt.toUtc().toIso8601String(),
      },
    );

    return ClientAppointmentModel.fromJson(response);
  }
}
