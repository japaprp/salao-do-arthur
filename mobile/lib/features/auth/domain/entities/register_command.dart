class RegisterCommand {
  const RegisterCommand({
    required this.name,
    required this.email,
    required this.password,
    required this.tenantSubdomain,
  });

  final String name;
  final String email;
  final String password;
  final String tenantSubdomain;
}
