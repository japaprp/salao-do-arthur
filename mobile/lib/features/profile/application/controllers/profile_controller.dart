import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barbearia_do_artur_mobile/core/result/result.dart';
import 'package:barbearia_do_artur_mobile/features/auth/application/providers/auth_providers.dart';
import 'package:barbearia_do_artur_mobile/features/profile/application/providers/profile_dependencies.dart';
import 'package:barbearia_do_artur_mobile/features/profile/application/state/profile_state.dart';
import 'package:barbearia_do_artur_mobile/features/profile/domain/use_cases/get_client_profile_use_case.dart';

class ProfileController extends Notifier<ProfileState> {
  late final GetClientProfileUseCase _getClientProfileUseCase;

  @override
  ProfileState build() {
    _getClientProfileUseCase = ref.read(getClientProfileUseCaseProvider);
    return const ProfileState();
  }

  Future<void> loadProfile() async {
    final accessToken =
        ref.read(authFlowControllerProvider).session?.accessToken;
    if (accessToken == null) {
      state = state.copyWith(
        failureMessage: 'Sessao expirada. Faça login novamente.',
      );
      return;
    }

    state = state.copyWith(
      isLoading: true,
      clearFailureMessage: true,
    );

    final result = await _getClientProfileUseCase(accessToken);
    switch (result) {
      case Success(value: final profile):
        state = state.copyWith(
          isLoading: false,
          profile: profile,
          clearFailureMessage: true,
        );
      case FailureResult(failure: final failure):
        state = state.copyWith(
          isLoading: false,
          failureMessage: failure.message,
        );
    }
  }
}
