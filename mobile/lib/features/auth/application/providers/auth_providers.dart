import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:salao_da_lu_mobile/features/auth/application/controllers/auth_flow_controller.dart';
import 'package:salao_da_lu_mobile/features/auth/application/state/auth_flow_state.dart';

final authFlowControllerProvider =
    NotifierProvider<AuthFlowController, AuthFlowState>(
  AuthFlowController.new,
);
