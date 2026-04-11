class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    required this.role,
    required this.tenantId,
    this.name,
  });

  final String id;
  final String email;
  final String role;
  final String tenantId;
  final String? name;
}
