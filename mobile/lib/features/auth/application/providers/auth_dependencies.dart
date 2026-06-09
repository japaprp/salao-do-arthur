import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barbearia_do_artur_mobile/core/network/api_client.dart';
import 'package:barbearia_do_artur_mobile/core/storage/secure_storage_provider.dart';
import 'package:barbearia_do_artur_mobile/core/storage/shared_preferences_provider.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/entities/onboarding_slide.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/repositories/onboarding_repository.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/use_cases/complete_onboarding_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/use_cases/forgot_password_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/use_cases/get_onboarding_status_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/use_cases/register_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/use_cases/restore_session_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/use_cases/sign_in_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/auth/domain/use_cases/sign_out_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/auth/infrastructure/datasources/auth_local_data_source.dart';
import 'package:barbearia_do_artur_mobile/features/auth/infrastructure/datasources/auth_remote_data_source.dart';
import 'package:barbearia_do_artur_mobile/features/auth/infrastructure/repositories/auth_repository_impl.dart';
import 'package:barbearia_do_artur_mobile/features/auth/infrastructure/repositories/onboarding_repository_impl.dart';

final authLocalDataSourceProvider = Provider<AuthLocalDataSource>((ref) {
  return AuthLocalDataSource(
    sharedPreferences: ref.watch(sharedPreferencesProvider),
    secureStorage: ref.watch(secureStorageProvider),
  );
});

final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  return AuthRemoteDataSource(ref.watch(apiClientProvider));
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    remoteDataSource: ref.watch(authRemoteDataSourceProvider),
    localDataSource: ref.watch(authLocalDataSourceProvider),
  );
});

final onboardingRepositoryProvider = Provider<OnboardingRepository>((ref) {
  return OnboardingRepositoryImpl(ref.watch(sharedPreferencesProvider));
});

final restoreSessionUseCaseProvider = Provider<RestoreSessionUseCase>((ref) {
  return RestoreSessionUseCase(ref.watch(authRepositoryProvider));
});

final getOnboardingStatusUseCaseProvider =
    Provider<GetOnboardingStatusUseCase>((ref) {
  return GetOnboardingStatusUseCase(
    ref.watch(onboardingRepositoryProvider),
  );
});

final completeOnboardingUseCaseProvider =
    Provider<CompleteOnboardingUseCase>((ref) {
  return CompleteOnboardingUseCase(
    ref.watch(onboardingRepositoryProvider),
  );
});

final signInUseCaseProvider = Provider<SignInUseCase>((ref) {
  return SignInUseCase(ref.watch(authRepositoryProvider));
});

final forgotPasswordUseCaseProvider = Provider<ForgotPasswordUseCase>((ref) {
  return ForgotPasswordUseCase(ref.watch(authRepositoryProvider));
});

final registerUseCaseProvider = Provider<RegisterUseCase>((ref) {
  return RegisterUseCase(ref.watch(authRepositoryProvider));
});

final signOutUseCaseProvider = Provider<SignOutUseCase>((ref) {
  return SignOutUseCase(ref.watch(authRepositoryProvider));
});

final onboardingSlidesProvider = Provider<List<OnboardingSlide>>((ref) {
  return const [
    OnboardingSlide(
      eyebrow: 'Agenda do Artur',
      title: 'Reserve sem ficar preso no WhatsApp.',
      description:
          'Escolha o servico, veja horarios reais e receba confirmacao com antecedencia.',
    ),
    OnboardingSlide(
      eyebrow: 'Lojinha real',
      title: 'Leve pomada, balm e pacotes junto do corte.',
      description:
          'Produtos e combos aparecem com preco, estoque e contexto para cuidar do visual em casa.',
    ),
    OnboardingSlide(
      eyebrow: 'Rotina sem aperto',
      title: 'O Artur consegue avisar, adiantar ou remarcar.',
      description:
          'Se abrir horario antes, se precisar ajustar ou cancelar, tudo fica registrado sem bagunca.',
    ),
  ];
});
