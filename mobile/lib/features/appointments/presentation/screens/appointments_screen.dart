import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:salao_da_lu_mobile/features/appointments/application/controllers/appointments_controller.dart';
import 'package:salao_da_lu_mobile/features/appointments/application/providers/appointments_providers.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/entities/appointment_professional_option.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/entities/appointment_service_option.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/entities/appointment_slot_option.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/entities/create_client_appointment_command.dart';
import 'package:salao_da_lu_mobile/features/appointments/presentation/widgets/appointment_booking_summary_card.dart';
import 'package:salao_da_lu_mobile/features/appointments/presentation/widgets/appointment_slot_chip.dart';
import 'package:salao_da_lu_mobile/features/appointments/presentation/widgets/client_appointment_card.dart';
import 'package:salao_da_lu_mobile/shared/design_system/theme/design_tokens.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_feedback_banner.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_gradient_scaffold.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_logo.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_primary_button.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_surface_card.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_text_field.dart';

class AppointmentsScreen extends ConsumerStatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  ConsumerState<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends ConsumerState<AppointmentsScreen> {
  late final TextEditingController _notesController;
  String? _selectedProfessionalId;
  DateTime? _selectedDate;
  AppointmentSlotOption? _selectedSlot;

  @override
  void initState() {
    super.initState();
    _notesController = TextEditingController();
    Future.microtask(
      () => ref.read(appointmentsControllerProvider.notifier).loadInitialData(),
    );
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(appointmentsControllerProvider);
    final controller = ref.read(appointmentsControllerProvider.notifier);
    final selectedService = _findSelectedService(
      state.services,
      state.selectedServiceId,
    );
    final selectedProfessional = _findSelectedProfessional(state.professionals);

    return AppGradientScaffold(
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AppLogo(
              subtitle: 'Agendamento self-service do cliente',
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Agende sem depender de mensagem manual.',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'O cliente escolhe serviço, profissional e um slot realmente livre sobre endpoints protegidos por tenant.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textMuted,
                  ),
            ),
            const SizedBox(height: AppSpacing.xl),
            if (state.failureMessage != null) ...[
              AppFeedbackBanner(message: state.failureMessage!),
              const SizedBox(height: AppSpacing.md),
            ],
            if (state.successMessage != null) ...[
              AppFeedbackBanner(
                message: state.successMessage!,
                tone: AppFeedbackTone.success,
              ),
              const SizedBox(height: AppSpacing.md),
            ],
            AppSurfaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Monte sua reserva',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  if (state.isLoading && state.services.isEmpty)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(AppSpacing.xl),
                        child: CircularProgressIndicator(),
                      ),
                    )
                  else ...[
                    DropdownButtonFormField<String>(
                      key: ValueKey(state.selectedServiceId),
                      initialValue: state.selectedServiceId,
                      decoration: const InputDecoration(
                        labelText: 'Servico',
                      ),
                      items: state.services
                          .map(
                            (service) => DropdownMenuItem<String>(
                              value: service.id,
                              child: Text(service.name),
                            ),
                          )
                          .toList(growable: false),
                      onChanged: (value) {
                        if (value == null) {
                          return;
                        }
                        setState(() {
                          _selectedProfessionalId = null;
                          _selectedDate = null;
                          _selectedSlot = null;
                        });
                        controller.clearMessages();
                        controller.loadProfessionals(value);
                      },
                    ),
                    const SizedBox(height: AppSpacing.md),
                    DropdownButtonFormField<String>(
                      key: ValueKey(_selectedProfessionalId),
                      initialValue: _selectedProfessionalId,
                      decoration: InputDecoration(
                        labelText: state.isLoadingProfessionals
                            ? 'Profissional (carregando...)'
                            : 'Profissional',
                      ),
                      items: state.professionals
                          .map(
                            (professional) => DropdownMenuItem<String>(
                              value: professional.id,
                              child: Text(
                                professional.specialty == null
                                    ? professional.name
                                    : '${professional.name} • ${professional.specialty}',
                              ),
                            ),
                          )
                          .toList(growable: false),
                      onChanged: state.isLoadingProfessionals
                          ? null
                          : (value) {
                              setState(() {
                                _selectedProfessionalId = value;
                                _selectedSlot = null;
                              });
                              if (value == null ||
                                  selectedService == null ||
                                  _selectedDate == null) {
                                controller.clearAvailableSlots();
                                return;
                              }
                              controller.loadAvailableSlots(
                                serviceId: selectedService.id,
                                professionalId: value,
                                date: _selectedDate!,
                              );
                            },
                    ),
                    const SizedBox(height: AppSpacing.md),
                    OutlinedButton(
                      onPressed: () => _selectDate(
                        selectedService: selectedService,
                        controller: controller,
                      ),
                      child: Text(
                        _selectedDate == null
                            ? 'Escolher data'
                            : DateFormat('dd/MM/yyyy').format(_selectedDate!),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      'Horarios sugeridos',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    if (state.isLoadingSlots)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                        child: Center(child: CircularProgressIndicator()),
                      )
                    else if (_selectedDate == null)
                      const AppSurfaceCard(
                        padding: EdgeInsets.all(AppSpacing.md),
                        child: Text(
                          'Escolha a data para ver os melhores horarios do dia.',
                        ),
                      )
                    else if (selectedProfessional == null)
                      const AppSurfaceCard(
                        padding: EdgeInsets.all(AppSpacing.md),
                        child: Text(
                          'Selecione o profissional antes de carregar os horarios.',
                        ),
                      )
                    else if (state.slots.isEmpty)
                      const AppSurfaceCard(
                        padding: EdgeInsets.all(AppSpacing.md),
                        child: Text(
                          'Nao encontramos janelas livres para essa combinacao. Tente outro dia ou profissional.',
                        ),
                      )
                    else
                      Wrap(
                        spacing: AppSpacing.sm,
                        runSpacing: AppSpacing.sm,
                        children: state.slots
                            .map(
                              (slot) => AppointmentSlotChip(
                                slot: slot,
                                isSelected:
                                    _selectedSlot?.startAt == slot.startAt,
                                onTap: () {
                                  setState(() {
                                    _selectedSlot = slot;
                                  });
                                },
                              ),
                            )
                            .toList(growable: false),
                      ),
                    const SizedBox(height: AppSpacing.md),
                    AppTextField(
                      controller: _notesController,
                      label: 'Observacoes para o salao',
                      hintText: 'Opcional',
                    ),
                    const SizedBox(height: AppSpacing.md),
                    AppointmentBookingSummaryCard(
                      service: selectedService,
                      professional: selectedProfessional,
                      scheduledAt: _selectedSlot?.startAt,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    AppPrimaryButton(
                      label: 'Confirmar agendamento',
                      isLoading: state.isSubmitting,
                      onPressed:
                          _canSubmit(selectedService, selectedProfessional)
                              ? () => _submitBooking(
                                    controller: controller,
                                    selectedService: selectedService!,
                                    selectedProfessional: selectedProfessional!,
                                  )
                              : null,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Meus agendamentos',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: AppSpacing.md),
            if (state.appointments.isEmpty)
              const AppSurfaceCard(
                child: Text(
                  'Ainda não há reservas para este cliente. Faça o primeiro agendamento acima.',
                ),
              )
            else
              Column(
                children: state.appointments
                    .map(
                      (appointment) => Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.md),
                        child: ClientAppointmentCard(
                          appointment: appointment,
                        ),
                      ),
                    )
                    .toList(growable: false),
              ),
          ],
        ),
      ),
    );
  }

  AppointmentServiceOption? _findSelectedService(
    List<AppointmentServiceOption> services,
    String? selectedServiceId,
  ) {
    if (selectedServiceId == null) {
      return null;
    }

    for (final service in services) {
      if (service.id == selectedServiceId) {
        return service;
      }
    }

    return null;
  }

  AppointmentProfessionalOption? _findSelectedProfessional(
    List<AppointmentProfessionalOption> professionals,
  ) {
    if (_selectedProfessionalId == null) {
      return null;
    }

    for (final professional in professionals) {
      if (professional.id == _selectedProfessionalId) {
        return professional;
      }
    }

    return null;
  }

  bool _canSubmit(
    AppointmentServiceOption? service,
    AppointmentProfessionalOption? professional,
  ) {
    return service != null && professional != null && _selectedSlot != null;
  }

  Future<void> _submitBooking({
    required AppointmentsController controller,
    required AppointmentServiceOption selectedService,
    required AppointmentProfessionalOption selectedProfessional,
  }) async {
    final success = await controller.book(
      CreateClientAppointmentCommand(
        serviceId: selectedService.id,
        professionalId: selectedProfessional.id,
        scheduledAt: _selectedSlot!.startAt,
        notes: _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
      ),
    );
    if (!success) {
      return;
    }

    setState(() {
      _notesController.clear();
      _selectedSlot = null;
    });

    if (_selectedDate == null) {
      return;
    }

    await controller.loadAvailableSlots(
      serviceId: selectedService.id,
      professionalId: selectedProfessional.id,
      date: _selectedDate!,
    );
  }

  Future<void> _selectDate({
    required AppointmentServiceOption? selectedService,
    required AppointmentsController controller,
  }) async {
    final now = DateTime.now();
    final initialDate = _selectedDate ?? now.add(const Duration(days: 1));
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: now,
      lastDate: now.add(const Duration(days: 90)),
      locale: const Locale('pt', 'BR'),
    );

    if (pickedDate == null) {
      return;
    }

    setState(() {
      _selectedDate = DateTime(
        pickedDate.year,
        pickedDate.month,
        pickedDate.day,
      );
      _selectedSlot = null;
    });

    if (selectedService == null ||
        _selectedProfessionalId == null ||
        _selectedDate == null) {
      controller.clearAvailableSlots();
      return;
    }

    await controller.loadAvailableSlots(
      serviceId: selectedService.id,
      professionalId: _selectedProfessionalId!,
      date: _selectedDate!,
    );
  }
}
