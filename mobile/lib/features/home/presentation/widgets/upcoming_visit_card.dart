import 'package:flutter/material.dart';
import 'package:salao_da_lu_mobile/shared/design_system/theme/design_tokens.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_primary_button.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_secondary_button.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_surface_card.dart';

class UpcomingVisitCard extends StatelessWidget {
  const UpcomingVisitCard({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AppSurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Coloração + hidratação premium',
            style: theme.textTheme.headlineSmall,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Segunda-feira, 15 de abril • 14:30 com Luana Martins',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: AppColors.textMuted,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.surfaceAlt,
              borderRadius: BorderRadius.circular(AppRadii.md),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Antes da visita',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Chegue 10 minutos antes. Seu ritual inclui diagnóstico capilar, bebida de boas-vindas e finalização personalizada.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          const AppPrimaryButton(
            label: 'Gerenciar reserva',
            onPressed: null,
          ),
          const SizedBox(height: AppSpacing.md),
          const AppSecondaryButton(
            label: 'Compartilhar horário',
            onPressed: null,
          ),
        ],
      ),
    );
  }
}
