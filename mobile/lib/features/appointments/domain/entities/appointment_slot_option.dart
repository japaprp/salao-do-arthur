class AppointmentSlotOption {
  const AppointmentSlotOption({
    required this.startAt,
    required this.endAt,
    required this.label,
  });

  final DateTime startAt;
  final DateTime endAt;
  final String label;
}
