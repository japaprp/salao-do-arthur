import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:salao_da_lu_mobile/features/profile/application/controllers/profile_controller.dart';
import 'package:salao_da_lu_mobile/features/profile/application/state/profile_state.dart';

final profileControllerProvider =
    NotifierProvider<ProfileController, ProfileState>(ProfileController.new);
