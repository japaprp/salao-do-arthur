import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:barbearia_do_artur_mobile/features/profile/domain/entities/client_profile.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/theme/design_tokens.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_surface_card.dart';

class LoyaltyOverviewCard extends StatelessWidget {
  const LoyaltyOverviewCard({
    super.key,
    required this.profile,
  });

  final ClientProfile profile;

  @override
  Widget build(BuildContext context) {
    return AppSurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Painel de fidelidade',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.md,
            runSpacing: AppSpacing.md,
            children: [
              _MetricBox(
                label: 'Saldo em carteira',
                value: '${profile.pointsBalance} pts',
              ),
              _MetricBox(
                label: 'Pontos acumulados',
                value: '${profile.loyaltyPoints} pts',
              ),
              _MetricBox(
                label: 'Lifetime value',
                value: NumberFormat.currency(symbol: 'R\$ ')
                    .format(profile.lifetimeValue),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricBox extends StatelessWidget {
  const _MetricBox({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minWidth: 180),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(AppRadii.md),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textMuted,
                ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            value,
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ],
      ),
    );
  }
}
