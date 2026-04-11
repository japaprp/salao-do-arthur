import 'package:salao_da_lu_mobile/features/auth/domain/entities/auth_session.dart';
import 'package:salao_da_lu_mobile/features/auth/infrastructure/models/auth_user_model.dart';

class AuthSessionModel {
  const AuthSessionModel({
    required this.accessToken,
    required this.tokenType,
    required this.expiresIn,
    required this.user,
  });

  final String accessToken;
  final String tokenType;
  final String expiresIn;
  final AuthUserModel user;

  AuthSession toEntity() {
    return AuthSession(
      accessToken: accessToken,
      tokenType: tokenType,
      expiresIn: expiresIn,
      user: user.toEntity(),
    );
  }
}
