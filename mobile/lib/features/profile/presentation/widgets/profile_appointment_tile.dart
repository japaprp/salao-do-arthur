import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:barbearia_do_artur_mobile/features/profile/domain/entities/client_profile_appointment.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/theme/design_tokens.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_surface_card.dart';

class ProfileAppointmentTile extends StatelessWidget {
  const ProfileAppointmentTile({
    super.key,
    required this.appointment,
  });

  final ClientProfileAppointment appointment;

  @override
  Widget build(BuildContext context) {
    return AppSurfaceCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            appointment.serviceName,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '${appointment.professionalName} • ${DateFormat('dd/MM/yyyy HH:mm').format(appointment.scheduledAt)}',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textMuted,
                ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _statusLabel(appointment.status),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              Text(
                NumberFormat.currency(symbol: 'R\$ ')
                    .format(appointment.totalAmount),
                style: Theme.of(context).textTheme.titleSmall,
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'SCHEDULED':
        return 'Agendado';
      case 'CHECKED_IN':
        return 'Check-in feito';
      case 'IN_PROGRESS':
        return 'Em atendimento';
      case 'COMPLETED':
        return 'Concluído';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  }
}
