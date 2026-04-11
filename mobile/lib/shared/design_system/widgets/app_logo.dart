import 'package:flutter/material.dart';
import 'package:salao_da_lu_mobile/shared/design_system/theme/design_tokens.dart';

class AppLogo extends StatelessWidget {
  const AppLogo({
    super.key,
    required this.subtitle,
  });

  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'SALAO DA LU',
          style: theme.textTheme.labelLarge,
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          subtitle,
          style: theme.textTheme.titleMedium?.copyWith(
            color: AppColors.textMuted,
          ),
        ),
      ],
    );
  }
}
