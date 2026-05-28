import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/application/providers/appointments_dependencies.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/application/state/appointments_state.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/appointment_service_option.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/appointment_slot_option.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/client_appointment.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/create_client_appointment_command.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/use_cases/book_client_appointment_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/use_cases/get_available_professionals_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/use_cases/get_available_slots_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/use_cases/get_my_appointments_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/use_cases/get_service_options_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/auth/application/providers/auth_providers.dart';

class AppointmentsController extends Notifier<AppointmentsState> {
  late final GetServiceOptionsUseCase _getServiceOptionsUseCase;
  late final GetAvailableProfessionalsUseCase _getAvailableProfessionalsUseCase;
  late final GetAvailableSlotsUseCase _getAvailableSlotsUseCase;
  late final GetMyAppointmentsUseCase _getMyAppointmentsUseCase;
  late final BookClientAppointmentUseCase _bookClientAppointmentUseCase;

  @override
  AppointmentsState build() {
    _getServiceOptionsUseCase = ref.read(getServiceOptionsUseCaseProvider);
    _getAvailableProfessionalsUseCase = ref.read(
      getAvailableProfessionalsUseCaseProvider,
    );
    _getAvailableSlotsUseCase = ref.read(getAvailableSlotsUseCaseProvider);
    _getMyAppointmentsUseCase = ref.read(getMyAppointmentsUseCaseProvider);
    _bookClientAppointmentUseCase =
        ref.read(bookClientAppointmentUseCaseProvider);

    return const AppointmentsState();
  }

  Future<void> loadInitialData() async {
    final accessToken = _readAccessToken();
    if (accessToken == null) {
      state = state.copyWith(
        failureMessage: 'Sessao expirada. Faça login novamente.',
      );
      return;
    }

    state = state.copyWith(
      isLoading: true,
      clearFailureMessage: true,
      clearSuccessMessage: true,
    );

    final servicesFuture = _getServiceOptionsUseCase(accessToken);
    final appointmentsFuture = _getMyAppointmentsUseCase(accessToken);
    final servicesResult = await servicesFuture;
    final appointmentsResult = await appointmentsFuture;

    if (servicesResult case FailureResult(failure: final failure)) {
      state = state.copyWith(
        isLoading: false,
        failureMessage: failure.message,
      );
      return;
    }

    if (appointmentsResult case FailureResult(failure: final failure)) {
      state = state.copyWith(
        isLoading: false,
        failureMessage: failure.message,
      );
      return;
    }

    final services =
        (servicesResult as Success<List<AppointmentServiceOption>>).value;
    final appointments =
        (appointmentsResult as Success<List<ClientAppointment>>).value;
    final selectedServiceId = services.isNotEmpty ? services.first.id : null;

    state = state.copyWith(
      isLoading: false,
      services: services,
      appointments: _sortAppointments(appointments),
      selectedServiceId: selectedServiceId,
      clearFailureMessage: true,
    );

    if (selectedServiceId != null) {
      await loadProfessionals(selectedServiceId);
    }
  }

  Future<void> loadProfessionals(String serviceId) async {
    final accessToken = _readAccessToken();
    if (accessToken == null) {
      state = state.copyWith(
        failureMessage: 'Sessao expirada. Faça login novamente.',
      );
      return;
    }

    state = state.copyWith(
      selectedServiceId: serviceId,
      isLoadingProfessionals: true,
      isLoadingSlots: false,
      clearFailureMessage: true,
      clearSuccessMessage: true,
      clearProfessionals: true,
      clearSlots: true,
    );

    final result = await _getAvailableProfessionalsUseCase(
      accessToken: accessToken,
      serviceId: serviceId,
    );

    switch (result) {
      case Success(value: final professionals):
        state = state.copyWith(
          isLoadingProfessionals: false,
          professionals: professionals,
          clearFailureMessage: true,
        );
      case FailureResult(failure: final failure):
        state = state.copyWith(
          isLoadingProfessionals: false,
          failureMessage: failure.message,
        );
    }
  }

  Future<void> loadAvailableSlots({
    required String serviceId,
    required String professionalId,
    required DateTime date,
  }) async {
    final accessToken = _readAccessToken();
    if (accessToken == null) {
      state = state.copyWith(
        failureMessage: 'Sessao expirada. Faça login novamente.',
      );
      return;
    }

    state = state.copyWith(
      isLoadingSlots: true,
      clearFailureMessage: true,
      clearSuccessMessage: true,
      clearSlots: true,
    );

    final result = await _getAvailableSlotsUseCase(
      accessToken: accessToken,
      serviceId: serviceId,
      professionalId: professionalId,
      date: date,
    );

    switch (result) {
      case Success(value: final slots):
        state = state.copyWith(
          isLoadingSlots: false,
          slots: _sortSlots(slots),
          clearFailureMessage: true,
        );
      case FailureResult(failure: final failure):
        state = state.copyWith(
          isLoadingSlots: false,
          failureMessage: failure.message,
        );
    }
  }

  Future<bool> book(CreateClientAppointmentCommand command) async {
    final accessToken = _readAccessToken();
    if (accessToken == null) {
      state = state.copyWith(
        failureMessage: 'Sessao expirada. Faça login novamente.',
      );
      return false;
    }

    state = state.copyWith(
      isSubmitting: true,
      clearFailureMessage: true,
      clearSuccessMessage: true,
    );

    final result = await _bookClientAppointmentUseCase(
      accessToken: accessToken,
      command: command,
    );

    switch (result) {
      case Success(value: final appointment):
        state = state.copyWith(
          isSubmitting: false,
          appointments: _sortAppointments([
            ...state.appointments.where((item) => item.id != appointment.id),
            appointment,
          ]),
          successMessage: 'Agendamento criado com sucesso.',
          clearFailureMessage: true,
        );
        return true;
      case FailureResult(failure: final failure):
        state = state.copyWith(
          isSubmitting: false,
          failureMessage: failure.message,
        );
        return false;
    }
  }

  void clearMessages() {
    state = state.copyWith(
      clearFailureMessage: true,
      clearSuccessMessage: true,
    );
  }

  void clearAvailableSlots() {
    state = state.copyWith(
      isLoadingSlots: false,
      clearSlots: true,
    );
  }

  String? _readAccessToken() {
    return ref.read(authFlowControllerProvider).session?.accessToken;
  }

  List<ClientAppointment> _sortAppointments(List<ClientAppointment> items) {
    final sorted = [...items];
    sorted.sort((left, right) => right.scheduledAt.compareTo(left.scheduledAt));
    return sorted;
  }

  List<AppointmentSlotOption> _sortSlots(List<AppointmentSlotOption> items) {
    final sorted = [...items];
    sorted.sort((left, right) => left.startAt.compareTo(right.startAt));
    return sorted;
  }
}
