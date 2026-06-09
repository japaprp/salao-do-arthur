import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:barbearia_do_artur_mobile/app/navigation/app_route.dart';
import 'package:barbearia_do_artur_mobile/features/profile/application/providers/profile_providers.dart';
import 'package:barbearia_do_artur_mobile/features/profile/domain/entities/client_profile.dart';
import 'package:barbearia_do_artur_mobile/features/profile/domain/entities/client_profile_appointment.dart';
import 'package:barbearia_do_artur_mobile/features/profile/presentation/widgets/loyalty_activity_tile.dart';
import 'package:barbearia_do_artur_mobile/features/profile/presentation/widgets/loyalty_overview_card.dart';
import 'package:barbearia_do_artur_mobile/features/profile/presentation/widgets/profile_appointment_tile.dart';
import 'package:barbearia_do_artur_mobile/features/profile/presentation/widgets/profile_header_card.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/theme/design_tokens.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_feedback_banner.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_gradient_scaffold.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_logo.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_surface_card.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(profileControllerProvider.notifier).loadProfile(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(profileControllerProvider);
    final profile = state.profile;

    return AppGradientScaffold(
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                IconButton(
                  tooltip: 'Voltar',
                  onPressed: () => context.go(AppRoute.home),
                  icon: const Icon(Icons.arrow_back_rounded),
                ),
                const SizedBox(width: AppSpacing.sm),
                const Expanded(
                  child: AppLogo(
                    subtitle: 'Perfil e fidelidade do cliente',
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Seu relacionamento com o salão em uma tela.',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Aqui o cliente acompanha pontos, histórico e a próxima visita sem depender de atendimento manual.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textMuted,
                  ),
            ),
            const SizedBox(height: AppSpacing.xl),
            if (state.failureMessage != null) ...[
              AppFeedbackBanner(message: state.failureMessage!),
              const SizedBox(height: AppSpacing.md),
            ],
            if (state.successMessage != null) ...[
              AppFeedbackBanner(
                message: state.successMessage!,
                tone: AppFeedbackTone.success,
              ),
              const SizedBox(height: AppSpacing.md),
            ],
            if (state.isLoading && profile == null)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(AppSpacing.xl),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (profile != null)
              _ProfileContent(
                profile: profile,
                isRedeeming: state.isRedeeming,
              ),
          ],
        ),
      ),
    );
  }
}

class _ProfileContent extends ConsumerWidget {
  const _ProfileContent({
    required this.profile,
    required this.isRedeeming,
  });

  final ClientProfile profile;
  final bool isRedeeming;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final nextAppointment = _findNextAppointment(profile.recentAppointments);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ProfileHeaderCard(profile: profile),
        const SizedBox(height: AppSpacing.md),
        LoyaltyOverviewCard(
          profile: profile,
          isRedeeming: isRedeeming,
          onRedeem: () => _showRedeemDialog(context, ref, profile.pointsBalance),
        ),
        const SizedBox(height: AppSpacing.xl),
        Text(
          'Próxima visita',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: AppSpacing.md),
        if (nextAppointment == null)
          const AppSurfaceCard(
            child: Text(
              'Ainda não há uma próxima visita confirmada. Use o fluxo de agendamento para reservar um horário.',
            ),
          )
        else
          ProfileAppointmentTile(appointment: nextAppointment),
        const SizedBox(height: AppSpacing.xl),
        Text(
          'Histórico recente',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: AppSpacing.md),
        if (profile.recentAppointments.isEmpty)
          const AppSurfaceCard(
            child: Text('Nenhum atendimento apareceu no perfil ainda.'),
          )
        else
          Column(
            children: profile.recentAppointments
                .map(
                  (appointment) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: ProfileAppointmentTile(appointment: appointment),
                  ),
                )
                .toList(growable: false),
          ),
        const SizedBox(height: AppSpacing.xl),
        Text(
          'Movimentações de fidelidade',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: AppSpacing.md),
        if (profile.loyaltyActivities.isEmpty)
          const AppSurfaceCard(
            child: Text(
              'Ainda não houve movimentações recentes na carteira de fidelidade.',
            ),
          )
        else
          Column(
            children: profile.loyaltyActivities
                .map(
                  (activity) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: LoyaltyActivityTile(activity: activity),
                  ),
                )
                .toList(growable: false),
          ),
      ],
    );
  }

  ClientProfileAppointment? _findNextAppointment(
    List<ClientProfileAppointment> appointments,
  ) {
    final now = DateTime.now();
    final upcoming = appointments
        .where((appointment) => appointment.scheduledAt.isAfter(now))
        .toList(growable: false);
    if (upcoming.isEmpty) {
      return null;
    }

    upcoming
        .sort((left, right) => left.scheduledAt.compareTo(right.scheduledAt));
    return upcoming.first;
  }

  Future<void> _showRedeemDialog(
    BuildContext context,
    WidgetRef ref,
    int pointsBalance,
  ) async {
    final controller = TextEditingController(text: pointsBalance.toString());
    final points = await showDialog<int>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Resgatar pontos'),
          content: TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: 'Pontos',
              helperText: 'Saldo disponivel: $pointsBalance pts',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () {
                final value = int.tryParse(controller.text.trim());
                Navigator.of(dialogContext).pop(value);
              },
              child: const Text('Confirmar'),
            ),
          ],
        );
      },
    );
    controller.dispose();

    if (points == null || points <= 0) {
      return;
    }

    await ref.read(profileControllerProvider.notifier).redeemPoints(points);
  }
}
