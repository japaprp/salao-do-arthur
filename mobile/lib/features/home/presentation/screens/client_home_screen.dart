import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:salao_da_lu_mobile/app/navigation/app_route.dart';
import 'package:salao_da_lu_mobile/features/auth/application/providers/auth_providers.dart';
import 'package:salao_da_lu_mobile/features/home/presentation/widgets/beauty_membership_card.dart';
import 'package:salao_da_lu_mobile/features/home/presentation/widgets/home_section_header.dart';
import 'package:salao_da_lu_mobile/features/home/presentation/widgets/home_welcome_card.dart';
import 'package:salao_da_lu_mobile/features/home/presentation/widgets/quick_action_tile.dart';
import 'package:salao_da_lu_mobile/features/home/presentation/widgets/upcoming_visit_card.dart';
import 'package:salao_da_lu_mobile/shared/design_system/theme/design_tokens.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_gradient_scaffold.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_logo.dart';

class ClientHomeScreen extends ConsumerWidget {
  const ClientHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authFlowControllerProvider).session;
    final userName = session?.user.name ?? 'Cliente';
    final userEmail = session?.user.email ?? 'cliente@salaodaluu.app';

    return AppGradientScaffold(
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Expanded(
                  child: AppLogo(
                    subtitle: 'Experiencia premium do cliente',
                  ),
                ),
                IconButton(
                  tooltip: 'Encerrar sessão',
                  onPressed: () {
                    ref.read(authFlowControllerProvider.notifier).signOut();
                  },
                  icon: const Icon(Icons.logout_rounded),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),
            HomeWelcomeCard(
              userName: userName,
              userEmail: userEmail,
            ),
            const SizedBox(height: AppSpacing.xl),
            const HomeSectionHeader(
              eyebrow: 'Jornada do cliente',
              title: 'O que você quer fazer hoje?',
            ),
            const SizedBox(height: AppSpacing.md),
            Wrap(
              spacing: AppSpacing.md,
              runSpacing: AppSpacing.md,
              children: [
                QuickActionTile(
                  icon: Icons.calendar_month_rounded,
                  title: 'Agendar horário',
                  description: 'Escolha serviço, profissional e melhor janela.',
                  onTap: () => context.go(AppRoute.appointments),
                ),
                QuickActionTile(
                  icon: Icons.workspace_premium_outlined,
                  title: 'Perfil e fidelidade',
                  description: 'Acompanhe pontos, histórico e próxima visita.',
                  onTap: () => context.go(AppRoute.profile),
                ),
                const QuickActionTile(
                  icon: Icons.shopping_bag_outlined,
                  title: 'Comprar produtos',
                  description: 'Leve para casa os cuidados recomendados.',
                ),
                const QuickActionTile(
                  icon: Icons.local_offer_outlined,
                  title: 'Ver pacotes',
                  description: 'Assinaturas e combos para recorrência premium.',
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),
            const HomeSectionHeader(
              eyebrow: 'Próxima visita',
              title: 'Sua agenda e benefícios em um só lugar',
            ),
            const SizedBox(height: AppSpacing.md),
            const UpcomingVisitCard(),
            const SizedBox(height: AppSpacing.md),
            const BeautyMembershipCard(),
          ],
        ),
      ),
    );
  }
}
