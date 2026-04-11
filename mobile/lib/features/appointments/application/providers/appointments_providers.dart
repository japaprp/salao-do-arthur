import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:salao_da_lu_mobile/features/appointments/application/controllers/appointments_controller.dart';
import 'package:salao_da_lu_mobile/features/appointments/application/state/appointments_state.dart';

final appointmentsControllerProvider =
    NotifierProvider<AppointmentsController, AppointmentsState>(
  AppointmentsController.new,
);
