import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/entities/client_appointment.dart';
import 'package:salao_da_lu_mobile/shared/design_system/theme/design_tokens.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_surface_card.dart';

class ClientAppointmentCard extends StatelessWidget {
  const ClientAppointmentCard({
    super.key,
    required this.appointment,
  });

  final ClientAppointment appointment;

  @override
  Widget build(BuildContext context) {
    final dateLabel = DateFormat("dd/MM/yyyy 'às' HH:mm").format(
      appointment.scheduledAt.toLocal(),
    );

    return AppSurfaceCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  appointment.serviceName,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              _AppointmentStatusChip(status: appointment.status),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text('Profissional: ${appointment.professionalName}'),
          const SizedBox(height: AppSpacing.xs),
          Text('Data: $dateLabel'),
          const SizedBox(height: AppSpacing.xs),
          Text('Duracao: ${appointment.durationMinutes} min'),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Total: ${NumberFormat.currency(symbol: 'R\$ ').format(appointment.totalAmount)}',
          ),
          if (appointment.notes != null &&
              appointment.notes!.trim().isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              appointment.notes!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textMuted,
                  ),
            ),
          ],
        ],
      ),
    );
  }
}

class _AppointmentStatusChip extends StatelessWidget {
  const _AppointmentStatusChip({
    required this.status,
  });

  final String status;

  @override
  Widget build(BuildContext context) {
    final label = switch (status) {
      'SCHEDULED' => 'Agendado',
      'CHECKED_IN' => 'Check-in',
      'IN_PROGRESS' => 'Em andamento',
      'COMPLETED' => 'Concluido',
      'CANCELLED' => 'Cancelado',
      _ => status,
    };

    final backgroundColor = switch (status) {
      'CANCELLED' => const Color(0xFFFFF0ED),
      'COMPLETED' => const Color(0xFFEEF8F2),
      _ => AppColors.surfaceAlt,
    };

    final foregroundColor = switch (status) {
      'CANCELLED' => AppColors.error,
      'COMPLETED' => AppColors.success,
      _ => AppColors.primary,
    };

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: foregroundColor,
            ),
      ),
    );
  }
}
