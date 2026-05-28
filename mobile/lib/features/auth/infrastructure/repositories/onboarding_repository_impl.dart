import 'package:shared_preferences/shared_preferences.dart';
import 'package:barbearia_do_artur_mobile/core/storage/app_storage_keys.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/repositories/onboarding_repository.dart';

class OnboardingRepositoryImpl implements OnboardingRepository {
  const OnboardingRepositoryImpl(this._sharedPreferences);

  final SharedPreferences _sharedPreferences;

  @override
  bool isCompleted() {
    return _sharedPreferences.getBool(AppStorageKeys.onboardingCompleted) ??
        false;
  }

  @override
  Future<void> complete() {
    return _sharedPreferences.setBool(
      AppStorageKeys.onboardingCompleted,
      true,
    );
  }
}
