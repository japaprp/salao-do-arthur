import 'package:barbearia_do_artur_mobile/features/auth/domain/entities/auth_session.dart';

class AuthFlowState {
  const AuthFlowState({
    required this.onboardingCompleted,
    required this.isBusy,
    this.session,
    this.failureMessage,
  });

  final bool onboardingCompleted;
  final bool isBusy;
  final AuthSession? session;
  final String? failureMessage;

  bool get isAuthenticated => session != null;

  AuthFlowState copyWith({
    bool? onboardingCompleted,
    bool? isBusy,
    AuthSession? session,
    bool clearSession = false,
    String? failureMessage,
    bool clearFailureMessage = false,
  }) {
    return AuthFlowState(
      onboardingCompleted: onboardingCompleted ?? this.onboardingCompleted,
      isBusy: isBusy ?? this.isBusy,
      session: clearSession ? null : session ?? this.session,
      failureMessage:
          clearFailureMessage ? null : failureMessage ?? this.failureMessage,
    );
  }
}
