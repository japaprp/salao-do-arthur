import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:salao_da_lu_mobile/app/navigation/app_router.dart';
import 'package:salao_da_lu_mobile/shared/design_system/theme/app_theme.dart';

class SalaoDaLuApp extends ConsumerWidget {
  const SalaoDaLuApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Salao da Lu',
      theme: AppTheme.light,
      routerConfig: router,
    );
  }
}
