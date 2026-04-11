class AppointmentProfessionalOption {
  const AppointmentProfessionalOption({
    required this.id,
    required this.name,
    this.specialty,
  });

  final String id;
  final String name;
  final String? specialty;
}
