class ClientAppointment {
  const ClientAppointment({
    required this.id,
    required this.serviceName,
    required this.professionalName,
    required this.scheduledAt,
    required this.status,
    required this.durationMinutes,
    required this.totalAmount,
    this.notes,
  });

  final String id;
  final String serviceName;
  final String professionalName;
  final DateTime scheduledAt;
  final String status;
  final int durationMinutes;
  final double totalAmount;
  final String? notes;
}
