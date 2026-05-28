import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barbearia_do_artur_mobile/core/network/api_client.dart';
import 'package:barbearia_do_artur_mobile/features/profile/domain/repositories/profile_repository.dart';
import 'package:barbearia_do_artur_mobile/features/profile/domain/use_cases/get_client_profile_use_case.dart';
import 'package:barbearia_do_artur_mobile/features/profile/infrastructure/datasources/profile_remote_data_source.dart';
import 'package:barbearia_do_artur_mobile/features/profile/infrastructure/repositories/profile_repository_impl.dart';

final profileRemoteDataSourceProvider =
    Provider<ProfileRemoteDataSource>((ref) {
  return ProfileRemoteDataSource(ref.watch(apiClientProvider));
});

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepositoryImpl(ref.watch(profileRemoteDataSourceProvider));
});

final getClientProfileUseCaseProvider =
    Provider<GetClientProfileUseCase>((ref) {
  return GetClientProfileUseCase(ref.watch(profileRepositoryProvider));
});
