import 'package:dio/dio.dart';
import 'package:salao_da_lu_mobile/core/errors/app_exception.dart';
import 'package:salao_da_lu_mobile/core/errors/failure.dart';
import 'package:salao_da_lu_mobile/core/result/result.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/entities/appointment_professional_option.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/entities/appointment_service_option.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/entities/appointment_slot_option.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/entities/client_appointment.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/entities/create_client_appointment_command.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/repositories/appointments_repository.dart';
import 'package:salao_da_lu_mobile/features/appointments/infrastructure/datasources/appointments_remote_data_source.dart';

class AppointmentsRepositoryImpl implements AppointmentsRepository {
  const AppointmentsRepositoryImpl(this._remoteDataSource);

  final AppointmentsRemoteDataSource _remoteDataSource;

  @override
  Future<Result<List<AppointmentServiceOption>>> getServiceOptions(
    String accessToken,
  ) async {
    try {
      final services = await _remoteDataSource.getServiceOptions(accessToken);
      return Success(
        services.map((item) => item.toEntity()).toList(growable: false),
      );
    } catch (error) {
      return FailureResult(_mapFailure(error));
    }
  }

  @override
  Future<Result<List<AppointmentProfessionalOption>>>
      getAvailableProfessionals({
    required String accessToken,
    required String serviceId,
  }) async {
    try {
      final professionals = await _remoteDataSource.getAvailableProfessionals(
        accessToken: accessToken,
        serviceId: serviceId,
      );
      return Success(
        professionals.map((item) => item.toEntity()).toList(growable: false),
      );
    } catch (error) {
      return FailureResult(_mapFailure(error));
    }
  }

  @override
  Future<Result<List<AppointmentSlotOption>>> getAvailableSlots({
    required String accessToken,
    required String serviceId,
    required String professionalId,
    required DateTime date,
  }) async {
    try {
      final slots = await _remoteDataSource.getAvailableSlots(
        accessToken: accessToken,
        serviceId: serviceId,
        professionalId: professionalId,
        date: date,
      );
      return Success(
        slots.map((item) => item.toEntity()).toList(growable: false),
      );
    } catch (error) {
      return FailureResult(_mapFailure(error));
    }
  }

  @override
  Future<Result<List<ClientAppointment>>> getMyAppointments(
      String accessToken) async {
    try {
      final appointments =
          await _remoteDataSource.getMyAppointments(accessToken);
      return Success(
        appointments.map((item) => item.toEntity()).toList(growable: false),
      );
    } catch (error) {
      return FailureResult(_mapFailure(error));
    }
  }

  @override
  Future<Result<ClientAppointment>> bookAppointment({
    required String accessToken,
    required CreateClientAppointmentCommand command,
  }) async {
    try {
      final appointment = await _remoteDataSource.bookAppointment(
        accessToken: accessToken,
        command: command,
      );
      return Success(appointment.toEntity());
    } catch (error) {
      return FailureResult(_mapFailure(error));
    }
  }

  Failure _mapFailure(Object error) {
    if (error is DioException) {
      final responseData = error.response?.data;
      final backendMessage =
          responseData is Map<String, dynamic> ? responseData['message'] : null;
      return Failure(
        message: backendMessage?.toString() ??
            'Falha ao carregar dados de agendamento.',
        code: '${error.response?.statusCode ?? 'network'}',
      );
    }

    if (error is AppException) {
      return Failure(
        message: error.message,
        code: '${error.statusCode ?? 'app'}',
      );
    }

    return const Failure(
      message: 'Falha inesperada durante o fluxo de agendamento.',
    );
  }
}
