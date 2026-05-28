import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:barbearia_do_artur_mobile/features/profile/domain/entities/loyalty_activity.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/theme/design_tokens.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_surface_card.dart';

class LoyaltyActivityTile extends StatelessWidget {
  const LoyaltyActivityTile({
    super.key,
    required this.activity,
  });

  final LoyaltyActivity activity;

  @override
  Widget build(BuildContext context) {
    final isPositive = activity.points >= 0;

    return AppSurfaceCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: isPositive ? AppColors.surfaceAlt : AppColors.primarySoft,
              borderRadius: BorderRadius.circular(AppRadii.md),
            ),
            alignment: Alignment.center,
            child: Text(
              '${isPositive ? '+' : ''}${activity.points}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activity.reason ?? activity.type,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  DateFormat('dd/MM/yyyy HH:mm').format(activity.createdAt),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textMuted,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
