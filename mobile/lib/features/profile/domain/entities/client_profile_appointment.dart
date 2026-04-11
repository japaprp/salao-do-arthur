class ClientProfileAppointment {
  const ClientProfileAppointment({
    required this.id,
    required this.serviceName,
    required this.professionalName,
    required this.scheduledAt,
    required this.status,
    required this.totalAmount,
  });

  final String id;
  final String serviceName;
  final String professionalName;
  final DateTime scheduledAt;
  final String status;
  final double totalAmount;
}
