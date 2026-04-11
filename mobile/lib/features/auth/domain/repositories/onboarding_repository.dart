abstract interface class OnboardingRepository {
  bool isCompleted();

  Future<void> complete();
}
