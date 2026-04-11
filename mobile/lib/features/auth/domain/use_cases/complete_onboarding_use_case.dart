import 'package:salao_da_lu_mobile/features/auth/domain/repositories/onboarding_repository.dart';

class CompleteOnboardingUseCase {
  const CompleteOnboardingUseCase(this._repository);

  final OnboardingRepository _repository;

  Future<void> call() {
    return _repository.complete();
  }
}
