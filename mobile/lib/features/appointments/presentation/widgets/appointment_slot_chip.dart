import 'package:flutter/material.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/entities/appointment_slot_option.dart';
import 'package:salao_da_lu_mobile/shared/design_system/theme/design_tokens.dart';

class AppointmentSlotChip extends StatelessWidget {
  const AppointmentSlotChip({
    super.key,
    required this.slot,
    required this.isSelected,
    required this.onTap,
  });

  final AppointmentSlotOption slot;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(slot.label),
      selected: isSelected,
      onSelected: (_) => onTap(),
      selectedColor: AppColors.primarySoft,
      labelStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: isSelected ? AppColors.ink : AppColors.textMuted,
          ),
      side: const BorderSide(color: AppColors.border),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadii.md),
      ),
    );
  }
}
