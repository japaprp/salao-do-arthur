import 'package:salao_da_lu_mobile/features/auth/domain/repositories/onboarding_repository.dart';

class GetOnboardingStatusUseCase {
  const GetOnboardingStatusUseCase(this._repository);

  final OnboardingRepository _repository;

  bool call() {
    return _repository.isCompleted();
  }
}
