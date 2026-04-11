import 'package:salao_da_lu_mobile/features/auth/domain/entities/auth_user.dart';

class AuthUserModel {
  const AuthUserModel({
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

  factory AuthUserModel.fromProfile(Map<String, dynamic> json) {
    return AuthUserModel(
      id: json['userId'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? '',
      tenantId: json['tenantId'] as String? ?? '',
    );
  }

  factory AuthUserModel.fromStorage(Map<String, String> values) {
    return AuthUserModel(
      id: values['id'] ?? '',
      email: values['email'] ?? '',
      role: values['role'] ?? '',
      tenantId: values['tenantId'] ?? '',
      name: values['name'],
    );
  }

  Map<String, String> toStorage() {
    return {
      'id': id,
      'email': email,
      'role': role,
      'tenantId': tenantId,
      'name': name ?? '',
    };
  }

  AuthUser toEntity() {
    return AuthUser(
      id: id,
      email: email,
      role: role,
      tenantId: tenantId,
      name: name?.isEmpty == true ? null : name,
    );
  }
}
