import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barbearia_do_artur_mobile/app/navigation/app_router.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/theme/app_theme.dart';

class BarbeariaDoArturApp extends ConsumerWidget {
  const BarbeariaDoArturApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Barbearia do Artur',
      theme: AppTheme.light,
      routerConfig: router,
    );
  }
}
