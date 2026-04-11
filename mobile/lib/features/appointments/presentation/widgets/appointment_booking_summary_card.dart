import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/entities/appointment_professional_option.dart';
import 'package:salao_da_lu_mobile/features/appointments/domain/entities/appointment_service_option.dart';
import 'package:salao_da_lu_mobile/shared/design_system/theme/design_tokens.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_surface_card.dart';

class AppointmentBookingSummaryCard extends StatelessWidget {
  const AppointmentBookingSummaryCard({
    super.key,
    required this.service,
    required this.professional,
    required this.scheduledAt,
  });

  final AppointmentServiceOption? service;
  final AppointmentProfessionalOption? professional;
  final DateTime? scheduledAt;

  @override
  Widget build(BuildContext context) {
    final dateLabel = scheduledAt == null
        ? 'Escolha data e horario'
        : DateFormat('dd/MM/yyyy HH:mm').format(scheduledAt!);

    return AppSurfaceCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Resumo do agendamento',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text('Servico: ${service?.name ?? 'Selecione um servico'}'),
          const SizedBox(height: AppSpacing.xs),
          Text(
              'Profissional: ${professional?.name ?? 'Selecione um profissional'}'),
          const SizedBox(height: AppSpacing.xs),
          Text('Quando: $dateLabel'),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Investimento: ${service == null ? '--' : NumberFormat.currency(symbol: 'R\$ ').format(service!.price)}',
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Duracao estimada: ${service == null ? '--' : '${service!.durationMinutes} min'}',
          ),
        ],
      ),
    );
  }
}
