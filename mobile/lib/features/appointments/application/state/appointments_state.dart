import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/appointment_professional_option.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/appointment_service_option.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/appointment_slot_option.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/domain/entities/client_appointment.dart';

class AppointmentsState {
  const AppointmentsState({
    this.isLoading = false,
    this.isLoadingProfessionals = false,
    this.isLoadingSlots = false,
    this.isSubmitting = false,
    this.failureMessage,
    this.successMessage,
    this.selectedServiceId,
    this.services = const [],
    this.professionals = const [],
    this.slots = const [],
    this.appointments = const [],
  });

  final bool isLoading;
  final bool isLoadingProfessionals;
  final bool isLoadingSlots;
  final bool isSubmitting;
  final String? failureMessage;
  final String? successMessage;
  final String? selectedServiceId;
  final List<AppointmentServiceOption> services;
  final List<AppointmentProfessionalOption> professionals;
  final List<AppointmentSlotOption> slots;
  final List<ClientAppointment> appointments;

  AppointmentsState copyWith({
    bool? isLoading,
    bool? isLoadingProfessionals,
    bool? isLoadingSlots,
    bool? isSubmitting,
    String? failureMessage,
    String? successMessage,
    String? selectedServiceId,
    List<AppointmentServiceOption>? services,
    List<AppointmentProfessionalOption>? professionals,
    List<AppointmentSlotOption>? slots,
    List<ClientAppointment>? appointments,
    bool clearFailureMessage = false,
    bool clearSuccessMessage = false,
    bool clearProfessionals = false,
    bool clearSlots = false,
  }) {
    return AppointmentsState(
      isLoading: isLoading ?? this.isLoading,
      isLoadingProfessionals:
          isLoadingProfessionals ?? this.isLoadingProfessionals,
      isLoadingSlots: isLoadingSlots ?? this.isLoadingSlots,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      failureMessage:
          clearFailureMessage ? null : (failureMessage ?? this.failureMessage),
      successMessage:
          clearSuccessMessage ? null : (successMessage ?? this.successMessage),
      selectedServiceId: selectedServiceId ?? this.selectedServiceId,
      services: services ?? this.services,
      professionals:
          clearProfessionals ? const [] : (professionals ?? this.professionals),
      slots: clearSlots ? const [] : (slots ?? this.slots),
      appointments: appointments ?? this.appointments,
    );
  }
}
