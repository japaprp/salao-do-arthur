class AppointmentServiceOption {
  const AppointmentServiceOption({
    required this.id,
    required this.name,
    required this.durationMinutes,
    required this.price,
    this.description,
  });

  final String id;
  final String name;
  final int durationMinutes;
  final double price;
  final String? description;
}
