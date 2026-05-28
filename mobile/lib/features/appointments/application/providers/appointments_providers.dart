import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/application/controllers/appointments_controller.dart';
import 'package:barbearia_do_artur_mobile/features/appointments/application/state/appointments_state.dart';

final appointmentsControllerProvider =
    NotifierProvider<AppointmentsController, AppointmentsState>(
  AppointmentsController.new,
);
