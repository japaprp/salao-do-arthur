import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barbearia_do_artur_mobile/core/notifications/notification_providers.dart';
import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/auth/application/providers/auth_dependencies.dart';
import 'package:barbearia_do_artur_mobile/features/auth/application/state/auth_flow_state.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/entities/auth_session.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/entities/register_command.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/use_cases/complete_onboarding_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/use_cases/forgot_password_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/use_cases/get_onboarding_status_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/use_cases/register_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/use_cases/restore_session_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/use_cases/sign_in_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/use_cases/sign_out_use_case.dart';

class AuthFlowController extends Notifier<AuthFlowState> {
  late final RestoreSessionUseCase _restoreSessionUseCase;
  late final GetOnboardingStatusUseCase _getOnboardingStatusUseCase;
  late final CompleteOnboardingUseCase _completeOnboardingUseCase;
  late final SignInUseCase _signInUseCase;
  late final ForgotPasswordUseCase _forgotPasswordUseCase;
  late final RegisterUseCase _registerUseCase;
  late final SignOutUseCase _signOutUseCase;

  @override
  AuthFlowState build() {
    _restoreSessionUseCase = ref.read(restoreSessionUseCaseProvider);
    _getOnboardingStatusUseCase = ref.read(getOnboardingStatusUseCaseProvider);
    _completeOnboardingUseCase = ref.read(completeOnboardingUseCaseProvider);
    _signInUseCase = ref.read(signInUseCaseProvider);
    _forgotPasswordUseCase = ref.read(forgotPasswordUseCaseProvider);
    _registerUseCase = ref.read(registerUseCaseProvider);
    _signOutUseCase = ref.read(signOutUseCaseProvider);

    final onboardingCompleted = _getOnboardingStatusUseCase();
    Future<void>.microtask(_restoreSession);

    return AuthFlowState(
      onboardingCompleted: onboardingCompleted,
      isBusy: false,
    );
  }

  Future<void> _restoreSession() async {
    final restoredSession = await _restoreSessionUseCase();
    if (restoredSession case Success(value: final session?)) {
      Future<void>.microtask(
        () => ref.read(fcmRegistrationServiceProvider).registerForSession(session),
      );
    }

    state = switch (restoredSession) {
      Success(value: final session) => state.copyWith(
          session: session,
          clearFailureMessage: true,
        ),
      FailureResult(failure: final failure) => state.copyWith(
          failureMessage: failure.message,
        ),
    };
  }

  Future<void> completeOnboarding() async {
    await _completeOnboardingUseCase();
    state = state.copyWith(
      onboardingCompleted: true,
      clearFailureMessage: true,
    );
  }

  Future<bool> signIn({
    required String tenantSubdomain,
    required String email,
    required String password,
  }) async {
    state = state.copyWith(
      isBusy: true,
      clearFailureMessage: true,
    );

    final result = await _signInUseCase(
      tenantSubdomain: tenantSubdomain,
      email: email,
      password: password,
    );

    return switch (result) {
      Success(value: final session) => _resolveSuccess(session),
      FailureResult(failure: final failure) => _resolveFailure(failure.message),
    };
  }

  Future<bool> register(RegisterCommand command) async {
    state = state.copyWith(
      isBusy: true,
      clearFailureMessage: true,
    );

    final result = await _registerUseCase(command);

    return switch (result) {
      Success(value: final session) => _resolveSuccess(session),
      FailureResult(failure: final failure) => _resolveFailure(failure.message),
    };
  }

  Future<bool> forgotPassword({
    required String tenantSubdomain,
    required String email,
  }) async {
    state = state.copyWith(
      isBusy: true,
      clearFailureMessage: true,
    );

    final result = await _forgotPasswordUseCase(
      tenantSubdomain: tenantSubdomain,
      email: email,
    );

    return switch (result) {
      Success() => _resolvePasswordResetRequested(),
      FailureResult(failure: final failure) => _resolveFailure(failure.message),
    };
  }

  Future<void> signOut() async {
    await _signOutUseCase();
    state = state.copyWith(
      isBusy: false,
      clearSession: true,
      clearFailureMessage: true,
    );
  }

  void clearFailureMessage() {
    state = state.copyWith(clearFailureMessage: true);
  }

  bool _resolveSuccess(AuthSession session) {
    state = state.copyWith(
      isBusy: false,
      session: session,
      clearFailureMessage: true,
    );
    Future<void>.microtask(
      () => ref.read(fcmRegistrationServiceProvider).registerForSession(session),
    );
    return true;
  }

  bool _resolveFailure(String message) {
    state = state.copyWith(
      isBusy: false,
      failureMessage: message,
    );
    return false;
  }

  bool _resolvePasswordResetRequested() {
    state = state.copyWith(
      isBusy: false,
      clearFailureMessage: true,
    );
    return true;
  }
}
