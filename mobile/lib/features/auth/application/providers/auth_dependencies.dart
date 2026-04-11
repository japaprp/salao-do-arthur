import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:salao_da_lu_mobile/core/network/api_client.dart';
import 'package:salao_da_lu_mobile/core/storage/shared_preferences_provider.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/entities/onboarding_slide.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/repositories/onboarding_repository.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/use_cases/complete_onboarding_use_case.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/use_cases/get_onboarding_status_use_case.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/use_cases/register_use_case.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/use_cases/restore_session_use_case.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/use_cases/sign_in_use_case.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/use_cases/sign_out_use_case.dart';
import 'package:salao_da_lu_mobile/features/auth/infrastructure/datasources/auth_local_data_source.dart';
import 'package:salao_da_lu_mobile/features/auth/infrastructure/datasources/auth_remote_data_source.dart';
import 'package:salao_da_lu_mobile/features/auth/infrastructure/repositories/auth_repository_impl.dart';
import 'package:salao_da_lu_mobile/features/auth/infrastructure/repositories/onboarding_repository_impl.dart';

final authLocalDataSourceProvider = Provider<AuthLocalDataSource>((ref) {
  return AuthLocalDataSource(ref.watch(sharedPreferencesProvider));
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

final registerUseCaseProvider = Provider<RegisterUseCase>((ref) {
  return RegisterUseCase(ref.watch(authRepositoryProvider));
});

final signOutUseCaseProvider = Provider<SignOutUseCase>((ref) {
  return SignOutUseCase(ref.watch(authRepositoryProvider));
});

final onboardingSlidesProvider = Provider<List<OnboardingSlide>>((ref) {
  return const [
    OnboardingSlide(
      eyebrow: 'Agenda premium',
      title: 'Reserve sem depender de troca de mensagens.',
      description:
          'Escolha horario, profissional e confirme em poucos toques com previsibilidade real.',
    ),
    OnboardingSlide(
      eyebrow: 'Boutique integrada',
      title: 'Compre produtos e pacotes na mesma jornada.',
      description:
          'O app cliente precisa vender recorrencia, tratamento e conveniencia, nao so agenda.',
    ),
    OnboardingSlide(
      eyebrow: 'Fidelidade viva',
      title: 'Acompanhe beneficios, historico e proximos cuidados.',
      description:
          'Cada visita vira relacionamento, recompra e retorno guiado pela marca do salao.',
    ),
  ];
});
