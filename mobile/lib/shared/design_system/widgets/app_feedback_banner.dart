import 'package:flutter/material.dart';
import 'package:salao_da_lu_mobile/shared/design_system/theme/design_tokens.dart';

enum AppFeedbackTone { error, success }

class AppFeedbackBanner extends StatelessWidget {
  const AppFeedbackBanner({
    super.key,
    required this.message,
    this.tone = AppFeedbackTone.error,
  });

  final String message;
  final AppFeedbackTone tone;

  @override
  Widget build(BuildContext context) {
    final isError = tone == AppFeedbackTone.error;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: isError ? const Color(0xFFFFF0ED) : const Color(0xFFEEF8F2),
        borderRadius: BorderRadius.circular(AppRadii.md),
        border: Border.all(
          color: isError ? const Color(0xFFF3C3BA) : const Color(0xFFB7DEC6),
        ),
      ),
      child: Text(
        message,
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: isError ? AppColors.error : AppColors.success,
            ),
      ),
    );
  }
}
