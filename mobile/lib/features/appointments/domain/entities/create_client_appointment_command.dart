class CreateClientAppointmentCommand {
  const CreateClientAppointmentCommand({
    required this.serviceId,
    required this.professionalId,
    required this.scheduledAt,
    this.notes,
  });

  final String serviceId;
  final String professionalId;
  final DateTime scheduledAt;
  final String? notes;
}
