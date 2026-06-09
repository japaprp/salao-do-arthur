import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barbearia_do_artur_mobile/core/network/api_client.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/repositories/appointments_repository.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/use_cases/cancel_client_appointment_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/use_cases/get_available_slots_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/use_cases/book_client_appointment_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/use_cases/get_available_professionals_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/use_cases/get_my_appointments_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/use_cases/get_service_options_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/use_cases/reschedule_client_appointment_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/infrastructure/datasources/appointments_remote_data_source.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/infrastructure/repositories/appointments_repository_impl.dart';

final appointmentsRemoteDataSourceProvider =
    Provider<AppointmentsRemoteDataSource>((ref) {
  return AppointmentsRemoteDataSource(ref.watch(apiClientProvider));
});

final appointmentsRepositoryProvider = Provider<AppointmentsRepository>((ref) {
  return AppointmentsRepositoryImpl(
    ref.watch(appointmentsRemoteDataSourceProvider),
  );
});

final getServiceOptionsUseCaseProvider =
    Provider<GetServiceOptionsUseCase>((ref) {
  return GetServiceOptionsUseCase(ref.watch(appointmentsRepositoryProvider));
});

final getAvailableProfessionalsUseCaseProvider =
    Provider<GetAvailableProfessionalsUseCase>((ref) {
  return GetAvailableProfessionalsUseCase(
    ref.watch(appointmentsRepositoryProvider),
  );
});

final getAvailableSlotsUseCaseProvider =
    Provider<GetAvailableSlotsUseCase>((ref) {
  return GetAvailableSlotsUseCase(ref.watch(appointmentsRepositoryProvider));
});

final getMyAppointmentsUseCaseProvider =
    Provider<GetMyAppointmentsUseCase>((ref) {
  return GetMyAppointmentsUseCase(ref.watch(appointmentsRepositoryProvider));
});

final bookClientAppointmentUseCaseProvider =
    Provider<BookClientAppointmentUseCase>((ref) {
  return BookClientAppointmentUseCase(
      ref.watch(appointmentsRepositoryProvider));
});

final cancelClientAppointmentUseCaseProvider =
    Provider<CancelClientAppointmentUseCase>((ref) {
  return CancelClientAppointmentUseCase(
    ref.watch(appointmentsRepositoryProvider),
  );
});

final rescheduleClientAppointmentUseCaseProvider =
    Provider<RescheduleClientAppointmentUseCase>((ref) {
  return RescheduleClientAppointmentUseCase(
    ref.watch(appointmentsRepositoryProvider),
  );
});
