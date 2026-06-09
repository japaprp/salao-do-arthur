import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barbearia_do_artur_mobile/core/network/api_client.dart';
import 'package:barbearia_do_artur_mobile/features/store/infrastructure/datasources/store_remote_data_source.dart';

final storeRemoteDataSourceProvider = Provider<StoreRemoteDataSource>((ref) {
  return StoreRemoteDataSource(ref.watch(apiClientProvider));
});
